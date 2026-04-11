import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
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

  ApiResponse.success(res, photos.map(p => ({
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

  ApiResponse.success(res, {
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

  ApiResponse.success(res);
}));


// 用户或管理员对权限内的照片进行筛选
router.get('/filter', adminOnly, asyncHandler(async (req, res) => {
  const query = z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    search: z.string().trim().max(100).optional(),
  }).parse(req.query);

  const userRole = req.user?.roleId ?? 2;
  const isAdmin = userRole === 1 || userRole === 3;

  const where: any = {};

  if (isAdmin) {
    where.status = query.status;
  } else {
    where.status = 'approved';
  }

  if (query.search) {
    const searchTerm = query.search;
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { member: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }
}))

export default router;
