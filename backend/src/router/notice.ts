import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { idParamSchema } from '../utils/z/notices.js';

const router = Router();

// 获取全部公告（无需权限）
router.get('/', asyncHandler(async (_req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' },
  });

  ApiResponse.success(res, notices.map((n) => ({
    id: n.id,
    title: n.title,
    contentUrl: n.contentUrl,
    createdAt: n.createdAt.toISOString(),
    createdMemberId: n.createdMemberId,
  })));
}));

// 获取指定id的公告（无需权限）
router.get('/:id', asyncHandler(async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的参数', 'invalid_parameters');
    return;
  }

  const notice = await prisma.notice.findUnique({ where: { id: parsed.data.id } });
  if (!notice) {
    ApiResponse.notFound(res, '公告不存在');
    return;
  }

  ApiResponse.success(res, {
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

export default router;
