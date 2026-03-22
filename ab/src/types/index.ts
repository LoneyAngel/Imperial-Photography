// 后端类型定义
export interface Member {
  id: string;
  email: string;
  name?: string;
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

