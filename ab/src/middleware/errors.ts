import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Express 错误处理中间件
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // 处理 Zod 验证错误
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: 'invalid_request',
      details: err.flatten()
    });
    return;
  }

  // 处理其他 Error 类型
  if (err instanceof Error) {
    const anyErr = err as unknown as { code?: string; name?: string };

    // 检查 Prisma 数据库相关错误
    if (
      anyErr.code === 'P1000' || // 认证失败
      anyErr.code === 'P1001' || // 无法连接到数据库
      anyErr.code === 'P1002' || // 连接超时
      anyErr.code === 'P1017' || // 服务器关闭连接
      anyErr.name === 'PrismaClientInitializationError' ||
      anyErr.name === 'PrismaClientKnownRequestError' ||
      err.message.includes('P1000') ||
      err.message.includes('P1001') ||
      err.message.includes('P1002') ||
      err.message.includes('P1017') ||
      err.message.includes('PrismaClientInitializationError') ||
      err.message.includes('PrismaClientKnownRequestError')
    ) {
      res.status(503).json({ error: 'db_unavailable' });
      return;
    }
  }

  // 处理未知错误
  res.status(500).json({ error: 'server_error' });
}