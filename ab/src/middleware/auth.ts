import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt.js';

// 扩展Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userId?: string;//快速访问
    }
  }
}

/**
 * JWT认证中间件
 * 验证请求中的JWT token并设置用户信息
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 从请求头中提取Token
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }

  // 验证Token
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'invalid_token' });
    return;
  }

  // 将用户信息附加到请求对象
  req.user = payload;
  req.userId = payload.userId;

  next();
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有则继续
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
      req.userId = payload.userId;
    }
  }

  next();
};

/**
 * 权限验证中间件
 * 验证用户是否有权限操作指定资源
 */
export const requireOwnership = (resourceType: 'member' | 'photo') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const resourceId = req.params.id;
    const userId = req.user.userId;

    // 对于会员资源，检查是否是自己的账户
    if (resourceType === 'member' && resourceId !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // 对于照片资源，需要查询数据库验证所有权
    if (resourceType === 'photo') {
      const { prisma } = await import('../utils/prisma.js');
      const photo = await prisma.photo.findUnique({
        where: { id: resourceId },
        select: { ownerMemberId: true }
      });

      if (!photo || photo.ownerMemberId !== userId) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
    }

    next();
  };
};