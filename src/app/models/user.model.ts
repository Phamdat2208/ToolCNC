export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'ACTIVE' | 'LOCKED' | 'DELETED';
  avatarUrl?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
