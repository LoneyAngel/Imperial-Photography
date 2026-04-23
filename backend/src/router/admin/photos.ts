import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';
import { adminPhotoQuerySchema, adminPhotoFilterSchema, updatePhotoStatusSchema } from '../../utils/z/photos.js';

const router = Router();

// 获取所有图片列表
router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const parsed = adminPhotoQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的查询参数', 'invalid_parameters');
    return;
  }

  const photos = await prisma.photo.findMany({
    where: parsed.data.status ? { status: parsed.data.status } : undefined,
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
  const photoId = [req.params.id].flat()[0];
  const parsed = updatePhotoStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的状态值', 'invalid_parameters');
    return;
  }

  const photo = await prisma.photo.update({
    where: { id:photoId },
    data: { status: parsed.data.status },
  });

  ApiResponse.success(res, { id: photo.id, status: photo.status });
}));

// 删除图片
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const photoId = [req.params.id].flat()[0];
  await prisma.photo.delete({ where: { id:photoId } });
  ApiResponse.success(res);
}));

// 用户或管理员对权限内的照片进行筛选
router.get('/filter', adminOnly, asyncHandler(async (req, res) => {
  const parsed = adminPhotoFilterSchema.safeParse(req.query);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的查询参数', 'invalid_parameters');
    return;
  }
  const query = parsed.data;

  const userRole = req.user?.roleId ?? 2;
  const isAdmin = userRole === 1 || userRole === 3;

  const where: any = {};
  where.status = isAdmin ? query.status : 'approved';

  if (query.search) {
    const searchTerm = query.search;
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { member: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }
}));

export default router;
