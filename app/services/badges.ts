// services/badges.ts
import ForumApi from '../ApiCore';

const api = new ForumApi();

export interface Badge {
 _id: string;
  key: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  tier: "bronze" | "silver" | "gold" | "special";
  isDefault: boolean;
  isAutomatic: boolean;
}

export interface BadgeUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isAssigned?: boolean; // new
}


const BASE = "/admin/badges";

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
    api.get<{ data: { badges: Badge} }>(`/admin/users/${id}}/badges`),
   assignToUser: (badgeId: string, userId: string) => api.post(`${BASE}/assign`, { badgeId, userId }),
 
  revokeFromUser: (badgeId: string, userId: string) =>
     api.delete(`${BASE}/assign?badgeId=${badgeId}&userId=${userId}`),
 
  getUserBadges: (userId: string) => api.get<{ data:{badges: Badge[]} }>(`${BASE}/assign`,  { userId }),
 
  searchUsers: (q: string, badgeId?: string) =>
  api.get<{ data: { users: BadgeUser[] } }>("/admin/users/search", { q, badgeId }),
  
};

  // list: (params?: { query?: string; status?: UserStatus | 'all'; page?: number }) =>
  //   api.get<{ data: { users: UserProfile[]; total?: number } }>('/admin/users', params),