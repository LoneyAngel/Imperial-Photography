import './env.js';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma.js';
import { putImage } from './storage.js';
import { generateVerificationCode, hashVerificationCode, sendVerificationEmail } from './utils/email.js';
import { ApiResponse } from './utils/api.js';
import { errorHandler } from './utils/errors.js';

const PORT = Number(process.env.PORT ?? '4001');
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const asyncHandler =
  <TReq extends express.Request, TRes extends express.Response>(
    fn: (req: TReq, res: TRes, next: express.NextFunction) => Promise<void>
  ) =>
  (req: TReq, res: TRes, next: express.NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
// 全局错误处理中间件
app.use(errorHandler);

// 健康检查路由
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// 请求验证码路由
app.post('/api/auth/request-code', asyncHandler(async (req, res) => {
  const body = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);

  // 检查邮箱是否已存在且已完成密码设置
  const existingMember = await prisma.member.findUnique({
    where: { email: body.email },
    select: { password: true }
  });

  if (existingMember && existingMember.password) {
    res.status(400).json({ error: 'member_already_registered' });
    return;
  }

  const code = generateVerificationCode();
  const expiresMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  const codeHash = hashVerificationCode(body.email, code);

  await prisma.emailVerificationCode.upsert({
    where: { email: body.email },
    update: { codeHash, expiresAt, attempts: 0 },
    create: { email: body.email, codeHash, expiresAt, attempts: 0 },
  });

  await sendVerificationEmail({ to: body.email, code, expiresMinutes });
  ApiResponse.ok(res, '验证码发送成功');
}));

// 验证验证码路由
app.post('/api/auth/verify-code', asyncHandler(async (req, res) => {
  const body = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      code: z.string().trim().min(6).max(6),
    })
    .parse(req.body);

  const record = await prisma.emailVerificationCode.findUnique({ where: { email: body.email } });
  if (!record) {
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    res.status(400).json({ error: 'expired_code' });
    return;
  }

  const hash = hashVerificationCode(body.email, body.code);
  if (hash !== record.codeHash) {
    const attempts = record.attempts + 1;
    if (attempts >= 5) {
      await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    } else {
      await prisma.emailVerificationCode.update({ where: { email: body.email }, data: { attempts } });
    }
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  await prisma.emailVerificationCode.delete({ where: { email: body.email } });

  const now = new Date();
  const displayName = body.email.split('@')[0] ?? body.email;
  const member = await prisma.member.upsert({
    where: { email: body.email },
    update: { verifiedAt: now },
    create: { email: body.email, verifiedAt: now, displayName },
  });

  res.json({
    id: member.id,
    email: member.email,
    createdAt: member.createdAt.toISOString(),
    verifiedAt: member.verifiedAt.toISOString(),
    displayName: member.displayName ?? undefined,
    bio: member.bio ?? undefined,
    hasPassword: !!member.password,
  });
}));

// 更新会员路由
app.put('/api/members/:id', asyncHandler(async (req, res) => {
  const params = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = z
    .object({
      displayName: z.string().trim().max(120).optional(),
      bio: z.string().trim().max(500).optional(),
    })
    .parse(req.body);

  const member = await prisma.member.update({
    where: { id: params.id },
    data: {
      displayName: body.displayName === undefined ? undefined : body.displayName,
      bio: body.bio === undefined ? undefined : body.bio,
    },
  });

  res.json({
    id: member.id,
    email: member.email,
    createdAt: member.createdAt.toISOString(),
    verifiedAt: member.verifiedAt.toISOString(),
    displayName: member.displayName ?? undefined,
    bio: member.bio ?? undefined,
  });
}));

// 获取摄影师本人照片路由
app.get('/api/photos', asyncHandler(async (req, res) => {
  const query = z
    .object({
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
      ownerMemberId: z.string().optional(),
    })
    .parse(req.query);

  const photos = await prisma.photo.findMany({
    where: {
      status: query.status,
      ownerMemberId: query.ownerMemberId,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    photos.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      description: p.description ?? undefined,
      ownerMemberId: p.ownerMemberId,
    }))
  );
}));

// 上传照片
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.post('/api/photos', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }

  const body = z
    .object({
      title: z.string().trim().max(200).default(''),
      description: z.string().trim().max(500).optional(),
      memberId: z.string().trim().min(1, '必须提供会员ID'), // 从前端传递会员ID
    })
    .parse(req.body);

  // 验证会员是否存在
  const member = await prisma.member.findUnique({
    where: { id: body.memberId }
  });

  if (!member) {
    res.status(400).json({ error: 'invalid_member' });
    return;
  }

  const baseForLocal = `http://localhost:${PORT}`;
  const uploaded = await putImage({
    buffer: file.buffer,
    mime: file.mimetype,
    originalName: file.originalname,
    publicBaseUrlForLocal: baseForLocal,
  });

  const photo = await prisma.photo.create({
    data: {
      title: body.title,
      description: body.description,
      url: uploaded.url,
      status: 'approved',
      ownerMemberId: body.memberId, // 使用前端传递的会员ID
    },
  });

  res.json({
    id: photo.id,
    title: photo.title,
    url: photo.url,
    status: photo.status,
    createdAt: photo.createdAt.toISOString(),
    description: photo.description ?? undefined,
    ownerMemberId: photo.ownerMemberId,
  });
}));

// 密码认证相关API

// 密码登录
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const body = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6),
    })
    .parse(req.body);

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

  res.json({
    id: member.id,
    email: member.email,
    createdAt: member.createdAt.toISOString(),
    verifiedAt: member.verifiedAt.toISOString(),
    displayName: member.displayName ?? undefined,
    bio: member.bio ?? undefined,
    hasPassword: !!member.password,
  });
}));

// 设置密码
app.post('/api/auth/set-password', asyncHandler(async (req, res) => {
  const body = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6),
    })
    .parse(req.body);

  const hashedPassword = await bcrypt.hash(body.password, 10);
  const now = new Date();
  const displayName = body.email.split('@')[0] ?? body.email;

  // 使用 upsert 确保会员存在并更新密码
  await prisma.member.upsert({
    where: { email: body.email },
    update: { password: hashedPassword },
    create: {
      email: body.email,
      password: hashedPassword,
      displayName,
      verifiedAt: now
    },
  });

  res.json({ success: true });
}));

// 重置密码的验证码
app.post('/api/auth/request-reset-code', asyncHandler(async (req, res) => {
  const body = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member || !member.password) {
    res.status(400).json({ error: 'no_password' });
    return;
  }

  const code = generateVerificationCode();
  const expiresMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);
  const codeHash = hashVerificationCode(body.email, code);

  await prisma.emailVerificationCode.upsert({
    where: { email: body.email },
    update: { codeHash, expiresAt, attempts: 0 },
    create: { email: body.email, codeHash, expiresAt, attempts: 0 },
  });

  await sendVerificationEmail({ to: body.email, code, expiresMinutes });
  res.json({ ok: true });
}));

// 验证重置密码的验证码
app.post('/api/auth/verify-reset-code', asyncHandler(async (req, res) => {
  const body = z
    .object({
      email: z.string().trim().toLowerCase().email(),
      code: z.string().trim().min(6).max(6),
    })
    .parse(req.body);

  const record = await prisma.emailVerificationCode.findUnique({ where: { email: body.email } });

  if (!record) {
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    res.status(400).json({ error: 'expired_code' });
    return;
  }

  const hash = hashVerificationCode(body.email, body.code);

  if (hash !== record.codeHash) {
    const attempts = record.attempts + 1;
    if (attempts >= 5) {
      await prisma.emailVerificationCode.delete({ where: { email: body.email } });
    } else {
      await prisma.emailVerificationCode.update({ where: { email: body.email }, data: { attempts } });
    }
    res.status(400).json({ error: 'invalid_code' });
    return;
  }

  await prisma.emailVerificationCode.delete({ where: { email: body.email } });

  // 生成重置令牌（简化版，实际应用中应该使用 JWT）
  const resetToken = `${body.email}_${Date.now()}_${Math.random()}`;

  res.json(resetToken);
}));

// 重置密码
app.post('/api/auth/reset-password', asyncHandler(async (req, res) => {
  const body = z
    .object({
      token: z.string().min(1),
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(6),
    })
    .parse(req.body);

  // 简化版验证，实际应用中应该验证 JWT token
  if (!body.token.includes(body.email)) {
    res.status(400).json({ error: 'invalid_token' });
    return;
  }

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member) {
    res.status(404).json({ error: 'member_not_found' });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  await prisma.member.update({
    where: { email: body.email },
    data: { password: hashedPassword },
  });

  res.json({ success: true });
}));

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`API listening on http://localhost:${PORT}`);
  }
});
