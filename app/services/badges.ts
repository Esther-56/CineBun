// services/badges.ts
import ForumApi from '../ApiCore';

const api = new ForumApi();

export interface Badge {
  _id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'special';
  isDefault: boolean;
}

export const BadgeService = {
  list: () =>
    api.get<{ data: { badges: Badge[] } }>('/admin/badges'),

  create: (data: Omit<Badge, '_id' | 'isDefault'> & { isDefault?: boolean }) =>
    api.post<{ data:{badge: Badge} }>('/admin/badges', data),

  update: (id: string, data: Partial<Badge>) =>
    api.patch<{ data:{badge: Badge} }>(`/admin/badges/${id}`, data),

  delete: (id: string) =>
    api.delete<{ deleted: boolean }>(`/admin/badges/${id}`),

  setDefault: (id: string) =>
    api.patch<{ badge: Badge }>(`/admin/badges/${id}`, { isDefault: true }),

  getUser: (id: string)=>
    api.get<{ data: { badges: Badge} }>(`/api/admin/users/${id}}/badges`),
  
};