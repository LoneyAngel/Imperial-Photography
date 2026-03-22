import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { authMiddleware, requireOwnership } from '../middleware/auth.js';

const router = Router();

// 更新会员信息
router.put('/:id', authMiddleware, requireOwnership('member'), asyncHandler(async (req, res) => {
  // ✅ 从JWT token获取用户ID，不再需要params验证
  const body = z
    .object({
      name: z.string().trim().max(120).optional(),
      bio: z.string().trim().max(500).optional(),
    })
    .parse(req.body);

  // ✅ 使用JWT中的用户ID，而不是params.id
  const member = await prisma.member.update({
    where: { id: req.userId }, // 从JWT token获取用户ID
    data: {
      name: body.name === undefined ? undefined : body.name,
      bio: body.bio === undefined ? undefined : body.bio,
    },
  });

  res.json({
    id: member.id,
    email: member.email,
    name: member.name ?? undefined,
    bio: member.bio ?? undefined,
  });
}));

export default router;