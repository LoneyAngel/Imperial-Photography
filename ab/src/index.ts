import './env.js';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { putImage } from './storage.js';
import { generateVerificationCode, hashVerificationCode, sendVerificationEmail } from './email.js';
import { ApiResponse, asyncHandler, validateRequest } from './utils/api.js';
import { validation, validateEmail, validatePassword, validateVerificationCode } from './utils/validation.js';

const PORT = Number(process.env.PORT ?? '4001');
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

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

const asyncHandler =
  <TReq extends express.Request, TRes extends express.Response>(
    fn: (req: TReq, res: TRes, next: express.NextFunction) => Promise<void>
  ) =>
  (req: TReq, res: TRes, next: express.NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/photographers', asyncHandler(async (_req, res) => {
  const photographers = await prisma.photographer.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    photographers.map((p) => ({
      id: p.id,
      name: p.name,
      bio: p.bio,
      createdAt: p.createdAt.toISOString(),
    }))
  );
}));

app.post('/api/photographers', asyncHandler(async (req, res) => {
  const body = z
    .object({
      name: z.string().trim().min(1).max(120),
      bio: z.string().trim().max(2000).default(''),
    })
    .parse(req.body);

  const photographer = await prisma.photographer.create({
    data: {
      name: body.name,
      bio: body.bio,
    },
  });

  res.json({
    id: photographer.id,
    name: photographer.name,
    bio: photographer.bio,
    createdAt: photographer.createdAt.toISOString(),
  });
}));

app.post('/api/members/login', asyncHandler(async (req, res) => {
  res.status(410).json({ error: 'deprecated' });
}));

app.post('/api/auth/request-code', asyncHandler(async (req, res) => {
  const body = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);

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

app.put('/api/members/:id', asyncHandler(async (req, res) => {
  const params = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = z
    .object({
      displayName: z.string().trim().max(120).optional(),
      bio: z.string().trim().max(2000).optional(),
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
      photographerId: p.photographerId,
      photographerName: p.photographerName,
      title: p.title,
      url: p.url,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      description: p.description ?? undefined,
      ownerMemberId: p.ownerMemberId ?? undefined,
    }))
  );
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
app.post('/api/photos', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }

  const body = z
    .object({
      title: z.string().trim().max(200).default(''),
      description: z.string().trim().max(2000).optional(),
      photographerName: z.string().trim().min(1).max(120),
      photographerId: z.string().trim().min(1).optional(),
      ownerMemberId: z.string().trim().min(1).optional(),
    })
    .parse(req.body);

  const baseForLocal = `http://localhost:${PORT}`;
  const uploaded = await putImage({
    buffer: file.buffer,
    mime: file.mimetype,
    originalName: file.originalname,
    publicBaseUrlForLocal: baseForLocal,
  });

  const photo = await prisma.photo.create({
    data: {
      photographerId: body.photographerId ?? `anon-${Date.now()}`,
      photographerName: body.photographerName,
      title: body.title,
      description: body.description,
      url: uploaded.url,
      status: 'approved',
      ownerMemberId: body.ownerMemberId,
    },
  });

  res.json({
    id: photo.id,
    photographerId: photo.photographerId,
    photographerName: photo.photographerName,
    title: photo.title,
    url: photo.url,
    status: photo.status,
    createdAt: photo.createdAt.toISOString(),
    description: photo.description ?? undefined,
    ownerMemberId: photo.ownerMemberId ?? undefined,
  });
}));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'invalid_request', details: err.flatten() });
    return;
  }
  if (err instanceof Error) {
    const anyErr = err as unknown as { code?: string; name?: string };
    if (
      anyErr.code === 'P1000' ||
      anyErr.code === 'P1001' ||
      anyErr.code === 'P1002' ||
      anyErr.code === 'P1017' ||
      anyErr.name === 'PrismaClientInitializationError' ||
      anyErr.name === 'PrismaClientKnownRequestError' ||
      err.message.includes('P1000') ||
      err.message.includes('P1001') ||
      err.message.includes('P1002') ||
      err.message.includes('P1017') ||
      err.message.includes('PrismaClientInitializationError') ||
      err.message.includes('PrismaClientKnownRequestError')
    ) {
      res.status(503).json({ error: 'db_unavailable' });
      return;
    }
  }
  res.status(500).json({ error: 'server_error' });
});

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

  const member = await prisma.member.findUnique({ where: { email: body.email } });

  if (!member) {
    res.status(404).json({ error: 'member_not_found' });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const updatedMember = await prisma.member.update({
    where: { email: body.email },
    data: { password: hashedPassword },
  });

  res.json({ success: true });
}));

// 请求重置密码验证码
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

// 验证重置密码验证码
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
