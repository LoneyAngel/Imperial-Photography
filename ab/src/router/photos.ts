import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { putImage } from '../storage.js';
import { authMiddleware } from '../middleware/auth.js';

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
      description: p.description ?? undefined,
      createdAt: p.createdAt.toISOString(),
      ownerMemberId: p.ownerMemberId,
    }))
  );
}));

// 上传照片
router.post('/', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'missing_file' });
    return;
  }

  const body = z.object({
    title: z.string().trim().max(200).default(''),
    description: z.string().trim().max(2000).optional(),
    // ✅ 移除memberId，从JWT token中获取
  }).parse(req.body);

  // ✅ 从JWT token中获取用户ID
  const memberId = req.userId!;
  if (!memberId) {
    res.status(401).json({ error: 'unauthorized' });
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
      ownerMemberId: memberId, // ✅ 从JWT token获取
    },
  });

  res.json({
    id: photo.id,
    title: photo.title,
    url: photo.url,
    status: photo.status,
    description: photo.description ?? undefined,
    ownerMemberId: photo.ownerMemberId,
  });
}));

// 修改照片信息
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const photoId = req.params.id;
  const memberId = req.userId!;

  // 检查照片是否属于当前用户
  const existingPhoto = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!existingPhoto) {
    res.status(404).json({ error: 'photo_not_found' });
    return;
  }

  if (existingPhoto.ownerMemberId !== memberId) {
    res.status(403).json({ error: 'not_owner' });
    return;
  }

  const body = z.object({
    title: z.string().trim().max(200).optional(),
    description: z.string().trim().max(2000).optional(),
  }).parse(req.body);

  const updatedPhoto = await prisma.photo.update({
    where: { id: photoId },
    data: {
      title: body.title,
      description: body.description,
    },
  });

  res.json({
    id: updatedPhoto.id,
    title: updatedPhoto.title,
    url: updatedPhoto.url,
    status: updatedPhoto.status,
    description: updatedPhoto.description ?? undefined,
    ownerMemberId: updatedPhoto.ownerMemberId,
  });
}));

// 删除照片
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const photoId = req.params.id;
  const memberId = req.userId!;

  // 检查照片是否属于当前用户
  const existingPhoto = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!existingPhoto) {
    res.status(404).json({ error: 'photo_not_found' });
    return;
  }

  if (existingPhoto.ownerMemberId !== memberId) {
    res.status(403).json({ error: 'not_owner' });
    return;
  }

  await prisma.photo.delete({
    where: { id: photoId },
  });

  res.json({ success: true });
}));

export default router;