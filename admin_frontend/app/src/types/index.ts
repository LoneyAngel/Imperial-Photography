export interface Photo {
  id: string;
  title: string;
  url: string;
  lowQualityUrl?: string;
  width?: number;
  height?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  description?: string;
  ownerMemberId: string;
  ownerName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Notice {
  id: string;
  title: string;
  contentUrl: string;
  createdAt: string;
  createdMemberId: string;
}

// 只有在个人中心才会用到这种数据类型
export interface Member {
  id: string;
  email: string;
  name?: string;
  password?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
