import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';
import { putNoticeContent, deleteNoticeContent } from '../../storage.js';

const router = Router();

// 获取所有通知
router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' },
  });

  ApiResponse.success(res, notices.map(n => ({
    id: n.id,
    title: n.title,
    contentUrl: n.contentUrl,
    createdAt: n.createdAt.toISOString(),
    createdMemberId: n.createdMemberId,
  })));
}));

// 创建通知
router.post('/', adminOnly, asyncHandler(async (req, res) => {
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

  ApiResponse.success(res, {
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

// 更新通知
router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().max(10000).optional(),
  }).parse(req.body);

  const existingNotice = await prisma.notice.findUnique({
    where: { id },
  });

  if (!existingNotice) {
    ApiResponse.notFound(res, '公告不存在');
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

  ApiResponse.success(res, {
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

// 删除通知
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existingNotice = await prisma.notice.findUnique({
    where: { id },
  });

  if (!existingNotice) {
    ApiResponse.notFound(res, '公告不存在');
    return;
  }

  const oldKey = existingNotice.contentUrl.split('/').pop();
  if (oldKey) {
    await deleteNoticeContent(oldKey);
  }

  await prisma.notice.delete({
    where: { id },
  });

  ApiResponse.success(res);
}));

export default router;
