import { Response } from 'express';
import express from 'express';
export const asyncHandler =
  <TReq extends express.Request, TRes extends express.Response>(
    fn: (req: TReq, res: TRes, next: express.NextFunction) => Promise<void>
  ) =>
  (req: TReq, res: TRes, next: express.NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };

// 通用的API响应工具
export const ApiResponse = {
  success: <T>(res: Response, data: T, message?: string) => {
    return res.status(200).json({
      success: true,
      data,
      message,
    });
  },

  error: (res: Response, message: string, statusCode: number = 400, code?: string) => {
    return res.status(statusCode).json({
      success: false,
      error: message,
      code,
    });
  },

  ok: (res: Response, message: string = '操作成功') => {
    return res.status(200).json({
      ok: true,
      message,
    });
  },

  badRequest: (res: Response, message: string = '请求参数错误', code?: string) => {
    return res.status(400).json({
      error: message,
      code,
    });
  },

  unauthorized: (res: Response, message: string = '未授权访问') => {
    return res.status(401).json({
      error: message,
    });
  },

  forbidden: (res: Response, message: string = '禁止访问') => {
    return res.status(403).json({
      error: message,
    });
  },

  notFound: (res: Response, message: string = '资源不存在') => {
    return res.status(404).json({
      error: message,
    });
  },

  conflict: (res: Response, message: string = '资源冲突') => {
    return res.status(409).json({
      error: message,
    });
  },
};

// 请求参数验证中间件
export const validateRequest = (validations: Record<string, Function>) => {
  return (req: any, res: any, next: any) => {
    const errors: string[] = [];

    for (const [field, validator] of Object.entries(validations)) {
      try {
        const value = req.body[field] || req.query[field] || req.params[field];
        validator(value);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, errors.join(', '));
    }

    next();
  };
};