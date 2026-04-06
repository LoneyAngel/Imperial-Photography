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
  bio?: string;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  password?: string;
  bio?: string;
  createdAt: string;
  role?: number;
}