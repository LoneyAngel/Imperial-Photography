import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';
import { putNoticeContent, deleteNoticeContent } from '../../utils/storage.js';
import { NoticeSchema, idParamSchema } from '../../utils/z/notices.js';

const router = Router();

// 获取所有通知
router.get('/', adminOnly, asyncHandler(async (_req, res) => {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' } });

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
  const parsed = NoticeSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }
  const { title, content } = parsed.data;
  const uploaded = await putNoticeContent({ content});

  const notice = await prisma.notice.create({
    data: { title, contentUrl: uploaded.url, createdMemberId: req.userId! },
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
  const paramParsed = idParamSchema.safeParse(req.params);
  if (!paramParsed.success) {
    ApiResponse.error(res, '无效的参数', 'invalid_parameters');
    return;
  }
  const { id } = paramParsed.data;

  const parsed = NoticeSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }
  const { title, content } = parsed.data;

  const existingNotice = await prisma.notice.findUnique({ where: { id } });
  if (!existingNotice) {
    ApiResponse.notFound(res, '公告不存在');
    return;
  }

  let contentUrl = existingNotice.contentUrl;
  if (content) {
    const uploaded = await putNoticeContent({ content });
    contentUrl = uploaded.url;
    const oldKey = existingNotice.contentUrl.split('/').pop();
    if (oldKey) await deleteNoticeContent(oldKey);
  }

  const notice = await prisma.notice.update({
    where: { id },
    data: { title, contentUrl },
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
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的参数', 'invalid_parameters');
    return;
  }
  const { id } = parsed.data;

  const existingNotice = await prisma.notice.findUnique({ where: { id } });
  if (!existingNotice) {
    ApiResponse.notFound(res, '公告不存在');
    return;
  }

  const oldKey = existingNotice.contentUrl.split('/').pop();
  if (oldKey) await deleteNoticeContent(oldKey);

  await prisma.notice.delete({ where: { id } });
  ApiResponse.success(res);
}));

export default router;
