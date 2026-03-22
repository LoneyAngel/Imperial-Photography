export interface Photo {
  id: string;
  title: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  description?: string;
  ownerMemberId: string;
}

export interface Member {
  id: string;
  email: string;
  createdAt: string;
  verifiedAt: string;
  displayName?: string;
  bio?: string;
  hasPassword?: boolean;
  token?: string; // ✅ 添加JWT Token
}

export type ViewMode = 'home' | 'gallery' | 'upload' | 'register' | 'member-auth' | 'member-profile';
