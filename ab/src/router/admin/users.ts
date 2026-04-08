import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { adminOnly } from '../../middleware/admin.js';

const router = Router();

// 获取所有用户列表
router.get('/', adminOnly, asyncHandler(async (req, res) => {
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
router.put('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = z.object({
    name: z.string().trim().max(20).optional(),
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
router.delete('/:id', adminOnly, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.member.delete({
    where: { id },
  });

  res.json({ success: true });
}));

export default router;
