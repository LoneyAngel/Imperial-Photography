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
  lowQualityUrl?: string;
  width?: number;
  height?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
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
