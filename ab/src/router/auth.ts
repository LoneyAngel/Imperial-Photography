import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { generateVerificationCode, hashVerificationCode, sendVerificationEmail } from '../utils/email.js';
import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyToken } from '../utils/jwt.js';

const router = Router();
async function createVerificationCodeRecord(email: string, code: string) {
  const codeHash = hashVerificationCode(email, code);

  // ✅ 使用UTC时间，避免时区问题
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  // 转换为UTC时间存储
  const utcExpiresAt = new Date(expiresAt.toISOString());

  await prisma.emailVerificationCode.upsert({
    where: { email },
    update: {
      codeHash,
      expiresAt: utcExpiresAt,
      attempts: 0,
    },
    create: {
      email,
      codeHash,
      expiresAt: utcExpiresAt,
      attempts: 0,
    },
  });
}
// 注册验证码
router.post('/request-register-code', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
  }).parse(req.body);
  const {email} = body;

  const existingMember = await prisma.member.findUnique({
    where: { email },
    select: { password: true }
  });

  if (existingMember && existingMember.password) {
    res.status(400).json({ error: 'member_already_registered' });
    return;
  }

  const code = generateVerificationCode();
  await Promise.all([
    createVerificationCodeRecord(email, code),
    sendVerificationEmail({ to: email, code })
  ]);
  res.json({ success: true });
}));
// 登录验证码
router.post('/request-login-code', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
  }).parse(req.body);
  const {email} = body;
  const existingMember = await prisma.member.findUnique({
    where: { email },
    select: { password: true }
  });
  if (existingMember && existingMember.password) {
    const code = generateVerificationCode();
    await Promise.all([
      createVerificationCodeRecord(email, code),
      sendVerificationEmail({ to: email, code })
    ]);
    res.json({ success: true });
  }
  else res.status(400).json({ error: '意外错误' });
}));
// 验证验证码
router.post('/verify-code', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().length(6).regex(/^\d+$/),
  }).parse(req.body);

  const record = await prisma.emailVerificationCode.findUnique({
    where: { email: body.email }
  });

  if (!record) {
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  if (new Date() > new Date(record.expiresAt)) {
    await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    res.status(400).json({ error: 'code_expired' });
    return;
  }
  const hash = hashVerificationCode(body.email, body.code);
  if (hash !== record.codeHash) {
    const attempts = record.attempts + 1;
    if (attempts >= 3) {
      await prisma.emailVerificationCode.delete({ where: { email: body.email } });
      res.status(400).json({ error: 'code_max_attempts' });
      return;
    }
    await prisma.emailVerificationCode.update({
      where: { email: body.email },
      data: { attempts }
    });
    res.status(400).json({ error: 'invalid_code' });
    return;
  }
  await prisma.emailVerificationCode.delete({ where: { email: body.email } });

  const member = await prisma.member.upsert({
    where: { email: body.email },
    update: {},
    create: {
      email: body.email,
      name: body.email.split('@')[0],
      verifiedAt: new Date()
    },
  });

  // 为用户赋予默认 user 角色（如果还没有角色）
  await prisma.userRole.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      roleId: 2, // user 角色
    },
  });

  const { authToken, refreshToken } = await generateTokenPair(member);

  res.json({
    user:{
      id: member.id,
      email: member.email,
      name: member.name,
      bio: member.bio,
    },
    authToken,
    refreshToken,
  });
}));

// 密码登录
router.post('/login', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
  }).parse(req.body);
  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member || !member.password) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  const isValidPassword = await bcrypt.compare(body.password, member.password);

  if (!isValidPassword) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }
  const { authToken, refreshToken } = await generateTokenPair(member);
  // 为用户赋予默认 user 角色（如果还没有角色）
  await prisma.userRole.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      roleId: 2, // user 角色
    },
  });


  res.json({
    user:{
      id: member.id,
      email: member.email,
      name: member.name,
      bio: member.bio,
    },
    authToken,
    refreshToken,
  });
}));

// 设置密码
router.post('/set-password', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
  }).parse(req.body);

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member) {
    res.status(404).json({ error: 'member_not_found' });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const name = body.email.split('@')[0];
  const now = new Date();

  const updatedMember = await prisma.member.update({
    where: { email: body.email },
    data: {
      password: hashedPassword,
      name,
      verifiedAt: now
    },
  });

  const { authToken, refreshToken } = await generateTokenPair(updatedMember);
  // 为用户赋予默认 user 角色（如果还没有角色）
  await prisma.userRole.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      roleId: 2, // user 角色
    },
  });


  res.json({
    user:{
      id: member.id,
      email: member.email,
      name: member.name,
      bio: member.bio,
    },
    authToken,
    refreshToken,
  });
}));

// 请求重置密码验证码
router.post('/request-reset-code', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
  }).parse(req.body);

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member || !member.password) {
    res.status(400).json({ error: 'no_password' });
    return;
  }

  const code = generateVerificationCode();
  await sendVerificationEmail({ to: body.email, code });

  res.json({ success: true });
}));

// 验证重置密码验证码
router.post('/verify-reset-code', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    code: z.string().length(6).regex(/^\d+$/),
  }).parse(req.body);

  const record = await prisma.emailVerificationCode.findUnique({
    where: { email: body.email }
  });

  if (!record) {
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  if (new Date() > new Date(record.expiresAt)) {
    await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    res.status(400).json({ error: 'code_expired' });
    return;
  }

  const hash = hashVerificationCode(body.email, body.code);
  if (hash !== record.codeHash) {
    const attempts = record.attempts + 1;
    if (attempts >= 3) {
      await prisma.emailVerificationCode.delete({ where: { email: body.email } });
      res.status(400).json({ error: 'code_max_attempts' });
      return;
    }
    await prisma.emailVerificationCode.update({
      where: { email: body.email },
      data: { attempts }
    });
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  await prisma.emailVerificationCode.delete({ where: { email: body.email } });
  res.json({ success: true });
}));

// 重置密码
router.post('/reset-password', asyncHandler(async (req, res) => {
  const body = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(6),
  }).parse(req.body);

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member || !member.password) {
    res.status(400).json({ error: 'no_password' });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  await prisma.member.update({
    where: { email: body.email },
    data: { password: hashedPassword },
  });

  res.json({ success: true });
}));

// 刷新token
router.post('/refresh', asyncHandler(async (req, res) => {
  const body = z.object({
    refreshToken: z.string(),
  }).parse(req.body);

  const payload = verifyToken(body.refreshToken);

  if (!payload || payload.type !== 'refresh') {
    res.status(401).json({ error: 'invalid_refresh_token' });
    return;
  }

  const member = await prisma.member.findUnique({
    where: { id: payload.userId }
  });

  if (!member) {
    res.status(401).json({ error: 'member_not_found' });
    return;
  }

  const { authToken, refreshToken: newRefreshToken } = await generateTokenPair(member);

  res.json({
    authToken,
    refreshToken: newRefreshToken,
  });
}));

export default router;