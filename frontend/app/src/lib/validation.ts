// 通用的表单验证工具
export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  },

  password: (password: string): { valid: boolean; error?: string } => {
    if (!password) {
      return { valid: false, error: '密码不能为空' };
    }
    if (password.length < 6) {
      return { valid: false, error: '密码至少需要6位' };
    }
    return { valid: true };
  },

  verificationCode: (code: string): { valid: boolean; error?: string } => {
    if (!code) {
      return { valid: false, error: '验证码不能为空' };
    }
    if (!/^\d{6}$/.test(code)) {
      return { valid: false, error: '验证码格式不正确' };
    }
    return { valid: true };
  },

  required: (value: string, fieldName: string): { valid: boolean; error?: string } => {
    if (!value || !value.trim()) {
      return { valid: false, error: `${fieldName}不能为空` };
    }
    return { valid: true };
  },

  fileSize: (file: File, maxSizeMB: number): { valid: boolean; error?: string } => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `文件大小不能超过${maxSizeMB}MB` };
    }
    return { valid: true };
  },

  fileType: (file: File, allowedTypes: string[]): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `只支持以下文件类型: ${allowedTypes.join(', ')}` };
    }
    return { valid: true };
  },
};

// 常用的邮箱验证
export const isValidEmail = (email: string): boolean => {
  return validation.email(email);
};

// 常用的密码验证
export const validatePassword = (password: string, confirmPassword?: string) => {
  const result = validation.password(password);
  if (!result.valid) return result;

  if (confirmPassword && password !== confirmPassword) {
    return { valid: false, error: '两次输入的密码不一致' };
  }

  return { valid: true };
};