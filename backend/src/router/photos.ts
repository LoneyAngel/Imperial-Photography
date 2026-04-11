import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler, ApiResponse } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { putImage } from '../storage.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 对审核通过的照片进行筛选
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const query = z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
  }).parse(req.query);

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
  const { memberId } = req.params;
  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
  }).parse(req.query);

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

  const body = z.object({
    title: z.string().trim().max(200).default(''),
    description: z.string().trim().max(2000).optional(),
  }).parse(req.body);

  const memberId = req.userId!;
  if (!memberId) {
    ApiResponse.error(res, '未授权', 'unauthorized', undefined, 401);
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
  const photoId = req.params.id;
  const memberId = req.userId!;

  const existingPhoto = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!existingPhoto) {
    ApiResponse.notFound(res, '照片不存在');
    return;
  }

  if (existingPhoto.ownerMemberId !== memberId) {
    ApiResponse.forbidden(res, '无权操作');
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
  const photoId = req.params.id;
  const memberId = req.userId!;

  const existingPhoto = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!existingPhoto) {
    ApiResponse.notFound(res, '照片不存在');
    return;
  }

  if (existingPhoto.ownerMemberId !== memberId) {
    ApiResponse.forbidden(res, '无权操作');
    return;
  }

  await prisma.photo.delete({
    where: { id: photoId },
  });

  ApiResponse.success(res);
}));

// 获取用户自己的照片列表
router.get('/user-photos', authMiddleware, asyncHandler(async (req, res) => {
  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
  }).parse(req.query);

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
