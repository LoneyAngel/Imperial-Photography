export interface Photographer {
  id: string;
  name: string;
  bio: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  photographerId: string;
  photographerName: string;
  title: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  description?: string;
  ownerMemberId?: string;
}

export interface Member {
  id: string;
  email: string;
  createdAt: string;
  verifiedAt: string;
  displayName?: string;
  bio?: string;
  hasPassword?: boolean;
}

export type ViewMode = 'home' | 'gallery' | 'upload' | 'register' | 'member-auth' | 'member-profile';
