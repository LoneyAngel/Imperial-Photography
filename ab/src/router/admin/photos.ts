import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';

const router = Router();

// 获取所有图片列表
router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const query = z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }).parse(req.query);

  const photos = await prisma.photo.findMany({
    where: query.status ? { status: query.status } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  res.json(photos.map(p => ({
    id: p.id,
    title: p.title,
    url: p.url,
    status: p.status,
    description: p.description ?? undefined,
    createdAt: p.createdAt.toISOString(),
    ownerMemberId: p.ownerMemberId,
  })));
}));

// 更新图片状态
router.put('/:id/status', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    status: z.enum(['pending', 'approved', 'rejected']),
  }).parse(req.body);

  const photo = await prisma.photo.update({
    where: { id },
    data: { status: body.status },
  });

  res.json({
    id: photo.id,
    status: photo.status,
  });
}));

// 删除图片
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.photo.delete({
    where: { id },
  });

  res.json({ success: true });
}));

export default router;
