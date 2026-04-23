import { Router } from 'express';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { generateVerificationCode, hashVerificationCode, sendVerificationEmail } from '../utils/email.js';
import bcrypt from 'bcryptjs';
import { generateTokenPair, verifyToken } from '../utils/jwt.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/cookie.js';
import {ApiResponse} from "../utils/api.js";
import { emailAndCodeSchema, emailAndPasswordSchema, emailSchema } from '../utils/z/auth.js';
const router = Router();

// 更新认证记录
async function createVerificationCodeRecord(email: string, code: string) {
  const codeHash = hashVerificationCode(email, code);

  // ✅ 使用UTC时间，避免时区问题
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  // 转换为UTC时间存储
  const utcExpiresAt = new Date(expiresAt.toISOString());

  const res = await prisma.emailVerificationCode.upsert({
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
  const a = emailSchema.safeParse(req.body) || {};
  if (!a.success) {
    ApiResponse.error(res, '无效的邮箱格式', 'invalid_email');
    return;
  }
  const email = a.data.email;

  const existingMember = await prisma.member.findUnique({
    where: { email: email },
    select: { password: true }
  });

  if (existingMember && existingMember.password) {
    ApiResponse.error(res, '账号已注册', 'member_already_registered', undefined, 409);
    return;
  }

  const code = generateVerificationCode();
  await Promise.all([
    createVerificationCodeRecord(email, code),
    sendVerificationEmail({ to: email, code })
  ]);
  ApiResponse.success(res);
}));
// 登录验证码
router.post('/request-code', asyncHandler(async (req, res) => {
  const a = emailSchema.safeParse(req.body) || {};
  if (!a.success) {
    ApiResponse.error(res, '无效的邮箱格式', 'invalid_email');
    return;
  }
  const email = a.data.email;
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
    ApiResponse.success(res);
  }
  else ApiResponse.error(res, '账号不存在', 'member_not_found');
}));

// 验证验证码
router.post('/verify-code', asyncHandler(async (req, res) => {
  const body = emailAndCodeSchema.safeParse(req.body);
  if (!body.success) {
    ApiResponse.error(res, '验证码或者邮箱有错误', 'invalid_parameters');
    return;
  }
  const { email, code } = body.data;
  const record = await prisma.emailVerificationCode.findUnique({
    where: { email: email }
  });

  if (!record) {
    ApiResponse.error(res, '验证码无效', 'invalid_code');
    return;
  }

  if (new Date() > new Date(record.expiresAt)) {
    await prisma.emailVerificationCode.delete({ where: { email: email } });
    ApiResponse.error(res, '验证码已过期', 'code_expired');
    return;
  }
  const hash = hashVerificationCode(email, code);
  if (hash !== record.codeHash) {
    const attempts = record.attempts + 1;
    if (attempts >= 3) {
      await prisma.emailVerificationCode.delete({ where: { email: email } });
      ApiResponse.error(res, '验证码错误次数过多', 'code_max_attempts');
      return;
    }
    await prisma.emailVerificationCode.update({
      where: { email: email },
      data: { attempts }
    });
    ApiResponse.error(res, '验证码不正确', 'invalid_code');
    return;
  }
  await prisma.emailVerificationCode.delete({ where: { email: email } });

  const member = await prisma.member.upsert({
    where: { email: email },
    update: {},
    create: {
      email: email,
      name: email.split('@')[0],
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

  const { authToken, refreshToken} = await generateTokenPair(member);

  // 设置 refreshToken 到 HttpOnly Cookie
  setRefreshTokenCookie(res, refreshToken);

  ApiResponse.success(res, {
    authToken
  });
}));

// 密码登录
router.post('/login', asyncHandler(async (req, res) => {
  const body = emailAndPasswordSchema.safeParse(req.body);
  if (!body.success) {
    ApiResponse.error(res, '无效的邮箱或密码格式', 'invalid_parameters');
    return;
  }
  const { email, password } = body.data;
  const member = await prisma.member.findUnique({ where: { email: email } });

  if (!member || !member.password) {
    ApiResponse.error(res, '用户不存在或未设置密码', 'member_not_found', undefined, 404);
    return;
  }

  const isValidPassword = await bcrypt.compare(password, member.password);

  if (!isValidPassword) {
    ApiResponse.error(res, '邮箱或密码错误', 'invalid_credentials', undefined, 400);
    return;
  }
  const { authToken, refreshToken } = await generateTokenPair(member);
  await prisma.userRole.upsert({
    where: { userId: member.id },
    update: {},
    create: {
      userId: member.id,
      roleId: 2, // user 普通用户角色
    },
  });

  // 设置 refreshToken 到 HttpOnly Cookie
  setRefreshTokenCookie(res, refreshToken);

  ApiResponse.success(res, {
    authToken,
  });
}));

// 设置密码
router.post('/set-password', asyncHandler(async (req, res) => {
  const body = emailAndPasswordSchema.safeParse(req.body);
  if (!body.success) {
    ApiResponse.error(res, '无效的邮箱或密码格式', 'invalid_parameters');
    return;
  }
  const { email, password } = body.data;

  const member = await prisma.member.findUnique({ where: { email: email } });

  if (!member) {
    ApiResponse.notFound(res, '用户不存在');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const name = email.split('@')[0];
  const now = new Date();

  const updatedMember = await prisma.member.update({
    where: { email: email },
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

  // 设置 refreshToken 到 HttpOnly Cookie
  setRefreshTokenCookie(res, refreshToken);
  ApiResponse.success(res, {
    authToken,
  });
}));

// 重置密码
router.post('/reset-password', asyncHandler(async (req, res) => {
  const body = emailAndPasswordSchema.safeParse(req.body);
  if( !body.success) {
    ApiResponse.error(res, '无效的邮箱或密码格式', 'invalid_parameters');
    return;
  }
  const { email, password } = body.data;
  const member = await prisma.member.findUnique({ where: { email: email } });

  if (!member || !member.password) {
    ApiResponse.error(res, '该账号未设置密码', 'no_password');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.member.update({
    where: { email: email },
    data: { password: hashedPassword },
  });

  ApiResponse.success(res);
}));

// 刷新token
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    ApiResponse.error(res, '缺少刷新令牌', 'missing_refresh_token', undefined, 401);
    return;
  }

  const payload = verifyToken(refreshToken);

  if (!payload || payload.type !== 'refresh') {
    clearRefreshTokenCookie(res);
    ApiResponse.error(res, '刷新令牌无效', 'invalid_refresh_token', undefined, 401);
    return;
  }

  const member = await prisma.member.findUnique({
    where: { id: payload.userId }
  });

  if (!member) {
    clearRefreshTokenCookie(res);
    ApiResponse.error(res, '用户不存在', 'member_not_found', undefined, 401);
    return;
  }

  const { authToken, refreshToken: newRefreshToken, roleId } = await generateTokenPair(member);

  setRefreshTokenCookie(res, newRefreshToken);

  ApiResponse.success(res, { authToken, roleId });
}));

// 登出（清除 cookie）
router.post('/logout', asyncHandler(async (_req, res) => {
  clearRefreshTokenCookie(res);
  ApiResponse.success(res);
}));

export default router;