// 后端验证工具
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email.trim().toLowerCase());
  },

  password: (password: string): { valid: boolean; error?: string } => {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: '密码不能为空' };
    }
    if (password.length < 6) {
      return { valid: false, error: '密码长度至少6位' };
    }
    return { valid: true };
  },

  verificationCode: (code: string): { valid: boolean; error?: string } => {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: '验证码不能为空' };
    }
    if (!/^\d{6}$/.test(code)) {
      return { valid: false, error: '验证码格式不正确' };
    }
    return { valid: true };
  },

  required: (value: any, fieldName: string): { valid: boolean; error?: string } => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return { valid: false, error: `${fieldName}不能为空` };
    }
    return { valid: true };
  },

  fileSize: (file: any, maxSizeMB: number): { valid: boolean; error?: string } => {
    if (!file || !file.size) {
      return { valid: false, error: '文件无效' };
    }
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `文件大小不能超过${maxSizeMB}MB` };
    }
    return { valid: true };
  },

  fileType: (file: any, allowedTypes: string[]): { valid: boolean; error?: string } => {
    if (!file || !file.mimetype) {
      return { valid: false, error: '文件类型无效' };
    }
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: `只支持以下文件类型: ${allowedTypes.join(', ')}` };
    }
    return { valid: true };
  },
};

// 常用的验证函数
export const validateEmail = (email: string): void => {
  if (!validation.email(email)) {
    throw new Error('邮箱格式不正确');
  }
};

export const validatePassword = (password: string): void => {
  const result = validation.password(password);
  if (!result.valid) {
    throw new Error(result.error);
  }
};

export const validateVerificationCode = (code: string): void => {
  const result = validation.verificationCode(code);
  if (!result.valid) {
    throw new Error(result.error);
  }
};