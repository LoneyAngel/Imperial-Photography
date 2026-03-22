export interface Photo {
  id: string;
  title: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  description?: string;
  ownerMemberId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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

export type ViewMode = 'home' | 'gallery' | 'upload' | 'register' | 'member-auth' | 'member-profile';
