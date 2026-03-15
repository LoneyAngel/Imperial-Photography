// 通用错误处理工具
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createError(message: string, statusCode: number = 400, code?: string) {
  return new AppError(message, statusCode, code);
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500,
    };
  }

  return {
    error: '服务器内部错误',
    statusCode: 500,
  };
}

// 常用的错误类型
export const Errors = {
  BAD_REQUEST: (message = '请求参数错误') => createError(message, 400),
  UNAUTHORIZED: (message = '未授权访问') => createError(message, 401),
  FORBIDDEN: (message = '禁止访问') => createError(message, 403),
  NOT_FOUND: (message = '资源不存在') => createError(message, 404),
  CONFLICT: (message = '资源冲突') => createError(message, 409),
  INTERNAL_ERROR: (message = '服务器内部错误') => createError(message, 500),
};

// 验证错误
export const ValidationErrors = {
  EMAIL_INVALID: () => createError('邮箱格式不正确', 400, 'invalid_email'),
  PASSWORD_TOO_SHORT: () => createError('密码长度至少6位', 400, 'password_too_short'),
  CODE_INVALID: () => createError('验证码格式不正确', 400, 'invalid_code'),
  REQUIRED_FIELD: (field: string) => createError(`${field}不能为空`, 400, 'required_field'),
};