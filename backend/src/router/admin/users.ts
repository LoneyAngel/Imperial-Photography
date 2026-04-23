import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';
import { updateMemberSchema } from '../../utils/z/members.js';

const router = Router();

// 获取所有用户列表
router.get('/', adminOnly, asyncHandler(async (_req, res) => {
  const users = await prisma.member.findMany({
    select: { id: true, email: true, name: true, bio: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  ApiResponse.success(res, users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    bio: u.bio ?? undefined,
    createdAt: u.createdAt.toISOString(),
  })));
}));

// 更新用户信息
router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const userId = [req.params.id].flat()[0];
  const parsed = updateMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的请求参数', 'invalid_parameters');
    return;
  }

  const user = await prisma.member.update({
    where: { id:userId },
    data: { name: parsed.data.name, bio: parsed.data.bio },
    select: { id: true, email: true, name: true, bio: true },
  });

  ApiResponse.success(res, {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    bio: user.bio ?? undefined,
  });
}));

// 删除用户
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const userId = [req.params.id].flat()[0];
  await prisma.member.delete({ where: { id: userId   } });
  ApiResponse.success(res);
}));

export default router;
