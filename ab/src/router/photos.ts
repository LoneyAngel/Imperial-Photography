import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { putImage } from '../storage.js';

const router = Router();

// 配置 multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 获取照片列表
router.get('/', asyncHandler(async (req, res) => {
  const query = z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    ownerMemberId: z.string().optional(),
  }).parse(req.query);

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
router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }

  const body = z.object({
    title: z.string().trim().max(200).default(''),
    description: z.string().trim().max(2000).optional(),
    memberId: z.string().trim().min(1, '必须提供会员ID'),
  }).parse(req.body);

  // 验证会员是否存在
  const member = await prisma.member.findUnique({
    where: { id: body.memberId }
  });

  if (!member) {
    res.status(400).json({ error: 'invalid_member' });
    return;
  }

  const baseForLocal = `http://localhost:${process.env.PORT || '4001'}`;
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
      ownerMemberId: body.memberId,
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

export default router;