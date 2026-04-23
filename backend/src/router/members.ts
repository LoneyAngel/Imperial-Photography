import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { updateMemberSchema } from '../utils/z/members.js';

const router = Router();
router.use(authMiddleware);

// 更新会员信息
router.put('/update', asyncHandler(async (req, res) => {
  const parsed = updateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }
  const body = parsed.data;

  const member = await prisma.member.update({
    where: { id: req.userId },
    data: {
      name: body.name === undefined ? undefined : body.name,
      bio: body.bio === undefined ? undefined : body.bio,
    },
  });

  ApiResponse.success(res, {
    id: member.id,
    email: member.email,
    name: member.name ?? undefined,
    bio: member.bio ?? undefined,
  });
}));

// 获取会员信息
router.get('/detail', asyncHandler(async (req, res) => {
  const member = await prisma.member.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, bio: true },
  });

  if (!member) {
    ApiResponse.notFound(res, 'Member not found');
    return;
  }

  ApiResponse.success(res, {
    id: member.id,
    email: member.email,
    name: member.name ?? undefined,
    bio: member.bio ?? undefined,
  });
}));

export default router;
