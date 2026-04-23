import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, ApiResponse } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { putImage } from '../utils/storage.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { photoQuerySchema, pageQuerySchema, PhotoSchema } from '../utils/z/photos.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 对审核通过的照片进行筛选
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const parsed = photoQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的查询参数', 'invalid_parameters');
    return;
  }
  const query = parsed.data;

  const where: any = { status: 'approved' };

  if (query.search) {
    const searchTerm = query.search;
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { member: { name: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  const PAGE_SIZE = 30;
  const [total, photos] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { member: { select: { name: true } } },
    }),
  ]);

  ApiResponse.success(res, {
    list: photos.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      status: p.status,
      description: p.description ?? undefined,
      createdAt: p.createdAt.toISOString(),
      ownerMemberId: p.ownerMemberId,
      ownerName: p.member.name || '匿名用户',
    })),
    total,
    page: query.page,
    pageSize: PAGE_SIZE,
  });
}));

// 公开获取指定用户的已审核照片
router.get('/member/:memberId', asyncHandler(async (req, res) => {
  const memberId = [req.params.memberId].flat()[0];
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的查询参数', 'invalid_parameters');
    return;
  }
  const query = parsed.data;

  const PAGE_SIZE = 30;
  const where = { ownerMemberId: memberId, status: 'approved' as const };

  const [member, total, photos] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId }, select: { name: true, bio: true } }),
    prisma.photo.count({ where }),
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  if (!member) {
    ApiResponse.notFound(res, '用户不存在');
    return;
  }

  ApiResponse.success(res, {
    member: { name: member.name || '匿名用户', bio: member.bio ?? undefined },
    list: photos.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      status: p.status,
      description: p.description ?? undefined,
      createdAt: p.createdAt.toISOString(),
      ownerMemberId: memberId,
      ownerName: member.name || '匿名用户',
    })),
    total,
    page: query.page,
    pageSize: PAGE_SIZE,
  });
}));

// 上传照片
router.post('/', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) {
    ApiResponse.error(res, '缺少文件', 'missing_file');
    return;
  }

  const parsed = PhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }
  const body = parsed.data;

  const memberId = req.userId!;
  if (!memberId) {
    ApiResponse.error(res, '未授权', 'unauthorized', undefined, 401);
    return;
  }

  const uploaded = await putImage({
    buffer: Buffer.from(file.buffer),
    mime: file.mimetype,
    originalName: file.originalname,
  });

  const photo = await prisma.photo.create({
    data: {
      title: body.title,
      description: body.description,
      url: uploaded.url,
      status: 'pending',
      ownerMemberId: memberId,
    },
  });

  ApiResponse.success(res, {
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
  const photoId = [req.params.id].flat()[0];
  const memberId = req.userId!;

  const existingPhoto = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!existingPhoto) {
    ApiResponse.notFound(res, '照片不存在');
    return;
  }
  if (existingPhoto.ownerMemberId !== memberId) {
    ApiResponse.forbidden(res, '无权操作');
    return;
  }

  const parsed = PhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }
  const body = parsed.data;

  const updatedPhoto = await prisma.photo.update({
    where: { id: photoId },
    data: { title: body.title, description: body.description },
  });

  ApiResponse.success(res, {
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
  const photoId = [req.params.id].flat()[0];
  const memberId = req.userId!;

  const existingPhoto = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!existingPhoto) {
    ApiResponse.notFound(res, '照片不存在');
    return;
  }
  if (existingPhoto.ownerMemberId !== memberId) {
    ApiResponse.forbidden(res, '无权操作');
    return;
  }

  await prisma.photo.delete({ where: { id: photoId } });
  ApiResponse.success(res);
}));

// 获取用户自己的照片列表
router.get('/user-photos', authMiddleware, asyncHandler(async (req, res) => {
  const parsed = pageQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的查询参数', 'invalid_parameters');
    return;
  }
  const query = parsed.data;

  const userId = req.userId;
  const PAGE_SIZE = 30;
  const where = { ownerMemberId: userId };

  const [total, photos, member] = await Promise.all([
    prisma.photo.count({ where }),
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.member.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  ApiResponse.success(res, {
    list: photos.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      status: p.status,
      description: p.description ?? undefined,
      createdAt: p.createdAt.toISOString(),
      ownerMemberId: userId,
      ownerName: member?.name || '匿名用户',
    })),
    total,
    page: query.page,
    pageSize: PAGE_SIZE,
  });
}));

export default router;
