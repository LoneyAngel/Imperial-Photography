import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware)

// 更新会员信息
router.put('/update', asyncHandler(async (req, res) => {
  const body = z
    .object({
      name: z.string().trim().max(20).optional(),
      bio: z.string().trim().max(500).optional(),
    })
    .parse(req.body);

  const member = await prisma.member.update({
    where: { id: req.userId },
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

// 获取会员信息
router.get('/detail', asyncHandler(async (req, res) => {

  const member = await prisma.member.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
    },
  });
  if (!member) {
    res.status(404).json({ message: 'Member not found' });
    return;
  }
  res.json({
    id: member.id,
    email: member.email,
    name: member.name ?? undefined,
    bio: member.bio ?? undefined,
  });
}));
 


export default router;