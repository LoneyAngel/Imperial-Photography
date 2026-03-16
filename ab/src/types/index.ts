// 后端类型定义
export interface Member {
  id: string;
  email: string;
  displayName?: string;
  password?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  ownerMemberId: string;
}

export interface EmailVerificationCode {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  email: string;
  password?: string;
  code?: string;
}

export interface UploadRequest {
  title: string;
  description?: string;
  memberId: string;
  file: Express.Multer.File;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// 请求上下文类型
export interface RequestContext {
  member?: Member;
  isAuthenticated: boolean;
}

// 文件上传相关类型
export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

