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
  createdAt?: string;
}

export interface Notice {
  id: string;
  title: string;
  contentUrl: string;
  createdAt: string;
  createdMemberId: string;
}
