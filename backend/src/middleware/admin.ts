import { Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/api.js';
import { prisma } from '../utils/prisma.js';

/**
 * 检查是否为管理员 (roleId = 1 或 3)
 */
export const adminOnly = asyncHandler(async (req, res: Response, next: NextFunction) => {
  const userRole = await prisma.userRole.findUnique({
    where: { userId: req.userId! },
    select: { roleId: true },
  });

  if (!userRole || (userRole.roleId !== 1 && userRole.roleId !== 3)) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
});

/**
 * 检查是否为超级管理员 (roleId = 3)
 */
export const superAdminOnly = asyncHandler(async (req, res: Response, next: NextFunction) => {
  const userRole = await prisma.userRole.findUnique({
    where: { userId: req.userId! },
    select: { roleId: true },
  });

  if (!userRole || userRole.roleId !== 3) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
});