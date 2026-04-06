import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// 获取全部公告（无需权限）
router.get('/', asyncHandler(async (req, res) => {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    notices.map((n) => ({
      id: n.id,
      title: n.title,
      contentUrl: n.contentUrl,
      createdAt: n.createdAt.toISOString(),
      createdMemberId: n.createdMemberId,
    }))
  );
}));

// 获取指定id的公告（无需权限）
router.get('/:id', asyncHandler(async (req, res) => {
  const params = z.object({
    id: z.string().min(1),
  }).parse(req.params);

  const notice = await prisma.notice.findUnique({
    where: { id: params.id },
  });

  if (!notice) {
    res.status(404).json({ error: 'notice_not_found' });
    return;
  }

  res.json({
    id: notice.id,
    title: notice.title,
    contentUrl: notice.contentUrl,
    createdAt: notice.createdAt.toISOString(),
    createdMemberId: notice.createdMemberId,
  });
}));

export default router;