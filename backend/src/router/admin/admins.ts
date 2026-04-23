import { Router } from 'express';
import { asyncHandler, ApiResponse } from '../../utils/api.js';
import { prisma } from '../../utils/prisma.js';
import { superAdminOnly } from '../../middleware/admin.js';
import { updateRoleSchema } from '../../utils/z/members.js';

const router = Router();

// 获取所有用户及其角色（超级管理员）
router.get('/', superAdminOnly, asyncHandler(async (_req, res) => {
  const users = await prisma.member.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      userRole: { select: { roleId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  ApiResponse.success(res, users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    createdAt: u.createdAt.toISOString(),
    roleId: u.userRole?.roleId ?? 2,
  })));
}));

// 更新用户角色（超级管理员）
router.put('/:id/role', superAdminOnly, asyncHandler(async (req, res) => {
  const userId = [req.params.id].flat()[0];
  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    ApiResponse.error(res, '无效的角色值', 'invalid_parameters');
    return;
  }

  if (userId === req.userId) {
    ApiResponse.error(res, '不能修改自己的角色', 'cannot_modify_self');
    return;
  }

  const userRole = await prisma.userRole.upsert({
    where: { userId: userId },
    update: { roleId: parsed.data.roleId },
    create: { userId: userId, roleId: parsed.data.roleId },
    select: { roleId: true },
  });

  ApiResponse.success(res, { id: userId, roleId: userRole.roleId });
}));

export default router;
