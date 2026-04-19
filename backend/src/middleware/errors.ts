import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Express 错误处理中间件
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // 处理 Zod 验证错误
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: 'invalid_request',
      details: err.issues
    });
    return;
  }

  // 检查 Prisma 数据库相关错误
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientInitializationError
  ) {
    res.status(503).json({ error: 'db_unavailable' });
    return;
  }

  // 处理未知错误
  res.status(500).json({ error: 'server_error' });
}