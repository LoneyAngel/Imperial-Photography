import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { superAdminOnly } from '../../middleware/admin.js';

const router = Router();

// 获取所有用户及其角色（超级管理员）
router.get('/', superAdminOnly, asyncHandler(async (req, res) => {
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
router.put('/:id/role', superAdminOnly, asyncHandler(async (req, res) => {
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

export default router;
