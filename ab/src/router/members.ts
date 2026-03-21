import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// 更新会员信息
router.put('/:id', asyncHandler(async (req, res) => {
  const params = z.object({ id: z.string().min(1) }).parse(req.params);
  const body = z
    .object({
      displayName: z.string().trim().max(120).optional(),
      bio: z.string().trim().max(500).optional(),
    })
    .parse(req.body);

  const member = await prisma.member.update({
    where: { id: params.id },
    data: {
      displayName: body.displayName === undefined ? undefined : body.displayName,
      bio: body.bio === undefined ? undefined : body.bio,
    },
  });

  res.json({
    id: member.id,
    email: member.email,
    createdAt: member.createdAt.toISOString(),
    verifiedAt: member.verifiedAt.toISOString(),
    displayName: member.displayName ?? undefined,
    bio: member.bio ?? undefined,
    hasPassword: !!member.password,
  });
}));

export default router;