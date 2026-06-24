import ForumApi from '../ApiCore';
import type {  UserStatus } from '../admin/lib/types';
import type { UserProfile, RecentThread } from '../u/[username]/types/index';


const api = new ForumApi();

export const UserService = {
  getMyProfile: () =>
    api.get<{ data:  UserProfile  }>(`/users/me`),

  getProfile: (username: string) =>
    api.get<{ data: { profile: UserProfile } }>(`/users/${username}`),

  getThreads: (username: string, page = 1) =>
    api.get<{ data: { items: RecentThread[]; total: number; page: number; pages: number } }>(
      `/users/${username}/threads`,
      { page }
    ),

  updateProfile: (body: {
    bio?: string; location?: string; website?: string;
    signature?: string; customTitle?: string; avatar?:string; banner?:string; socials?: Record<string, string>;
  }) => api.patch('/users/me', body),

  updateAppearance: (body: {
    theme: string; usernameEffect: string|null; avatarEffect: string|null;}) => api.patch('/users/me', body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch('/users/me/password', body),

  updateAvatarUrl: (avatar: string) => {
    return api.patch('/users/me/avatar', avatar);
  },

  updateTheme: (themeId: string) =>
    api.patch('/users/me/theme', { themeId }),

  list: (params?: { query?: string; status?: UserStatus | 'all'; page?: number }) =>
    api.get<{ data: { users: UserProfile[]; total?: number } }>('/admin/users', params),

  update: (userId: string, body: { role?: string }) =>
    api.patch<{ user: UserProfile }>(`/admin/users/${userId}`, body),

  warn: (userId: string, reason: string) =>
    api.patch<{ user: UserProfile }>(`/admin/users/${userId}/warn`, { reason }),

  suspend: (id: string, reason: string, hours: number) =>
    api.patch<{ user: UserProfile }>(`/admin/users/${id}/suspend`, { reason, hours }),

  ban: (userId: string, reason: string) =>
    api.patch<{ user: UserProfile }>(`/admin/users/${userId}/ban`, { reason }),

  unban: (userId: string) =>
    api.patch<{ user: UserProfile }>(`/admin/users/${userId}/unban`),

  
};