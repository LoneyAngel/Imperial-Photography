import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { putNoticeContent, deleteNoticeContent } from '../storage.js';

const router = Router();

// 所有管理员路由都需要认证
router.use(authMiddleware);

// 检查是否为管理员 (roleId = 1 或 3)
const adminOnly = asyncHandler(async (req, res, next) => {
  const userRole = await prisma.userRole.findUnique({
    where: { userId: req.userId! },
    select: { roleId: true },
  });

  if (!userRole || (userRole.roleId !== 1 && userRole.roleId !== 3)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
});

// 检查是否为超级管理员 (roleId = 3)
const superAdminOnly = asyncHandler(async (req, res, next) => {
  const userRole = await prisma.userRole.findUnique({
    where: { userId: req.userId! },
    select: { roleId: true },
  });

  if (!userRole || userRole.roleId !== 3) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
});

// 获取所有用户列表
router.get('/users', adminOnly, asyncHandler(async (req, res) => {
  const users = await prisma.member.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    bio: u.bio ?? undefined,
    createdAt: u.createdAt.toISOString(),
  })));
}));

// 更新用户信息
router.put('/users/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    name: z.string().trim().max(120).optional(),
    bio: z.string().trim().max(500).optional(),
  }).parse(req.body);

  const user = await prisma.member.update({
    where: { id },
    data: {
      name: body.name,
      bio: body.bio,
    },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
    },
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    bio: user.bio ?? undefined,
  });
}));

// 删除用户
router.delete('/users/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.member.delete({
    where: { id },
  });

  res.json({ success: true });
}));

// 获取所有图片列表
router.get('/photos', adminOnly, asyncHandler(async (req, res) => {
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
router.put('/photos/:id/status', adminOnly, asyncHandler(async (req, res) => {
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
router.delete('/photos/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.photo.delete({
    where: { id },
  });

  res.json({ success: true });
}));

// ========== 超级管理员专属路由 ==========

// 获取所有用户及其角色（超级管理员）
router.get('/admins', superAdminOnly, asyncHandler(async (req, res) => {
  const users = await prisma.member.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      userRole: {
        select: { roleId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    createdAt: u.createdAt.toISOString(),
    roleId: u.userRole?.roleId ?? 2,
  })));
}));

// 更新用户角色（超级管理员）
router.put('/admins/:id/role', superAdminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    roleId: z.number().int().min(1).max(3),
  }).parse(req.body);

  // 不能修改自己的角色
  if (id === req.userId) {
    res.status(400).json({ error: 'cannot_modify_self' });
    return;
  }

  const userRole = await prisma.userRole.upsert({
    where: { userId: id },
    update: { roleId: body.roleId },
    create: { userId: id, roleId: body.roleId },
    select: { roleId: true },
  });

  res.json({ id, roleId: userRole.roleId });
}));

// ========== 通知管理路由 ==========

// 获取所有通知
router.get('/notices', adminOnly, asyncHandler(async (req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json(notices.map(n => ({
    id: n.id,
    title: n.title,
    contentUrl: n.contentUrl,
    createdAt: n.createdAt.toISOString(),
    createdMemberId: n.createdMemberId,
  })));
}));

// 创建通知
router.post('/notices', adminOnly, asyncHandler(async (req, res) => {
  const body = z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().max(10000),
  }).parse(req.body);

  const baseForLocal = `http://localhost:${process.env.PORT || '4001'}`;
  const uploaded = await putNoticeContent({
    content: body.content,
    publicBaseUrlForLocal: baseForLocal,
  });

  const notice = await prisma.notice.create({
    data: {
      title: body.title,
      contentUrl: uploaded.url,
      createdMemberId: req.userId!,
    },
  });

  res.json({
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

// 更新通知
router.put('/notices/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().max(10000).optional(),
  }).parse(req.body);

  const existingNotice = await prisma.notice.findUnique({
    where: { id },
  });

  if (!existingNotice) {
    res.status(404).json({ error: 'notice_not_found' });
    return;
  }

  let contentUrl = existingNotice.contentUrl;
  if (body.content) {
    const baseForLocal = `http://localhost:${process.env.PORT || '4001'}`;
    const uploaded = await putNoticeContent({
      content: body.content,
      publicBaseUrlForLocal: baseForLocal,
    });
    contentUrl = uploaded.url;
    // 删除旧内容文件
    const oldKey = existingNotice.contentUrl.split('/').pop();
    if (oldKey) {
      await deleteNoticeContent(oldKey);
    }
  }

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      title: body.title,
      contentUrl,
    },
  });

  res.json({
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

// 删除通知
router.delete('/notices/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingNotice = await prisma.notice.findUnique({
    where: { id },
  });

  if (!existingNotice) {
    res.status(404).json({ error: 'notice_not_found' });
    return;
  }

  // 删除内容文件
  const oldKey = existingNotice.contentUrl.split('/').pop();
  if (oldKey) {
    await deleteNoticeContent(oldKey);
  }

  await prisma.notice.delete({
    where: { id },
  });

  res.json({ success: true });
}));

export default router;