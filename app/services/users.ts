import ForumApi from '../ApiCore';
import type {  UserStatus } from '../admin/lib/types';
import type { UserProfile, RecentThread } from '../u/[username]/types/index';


const api = new ForumApi();

export const UserService = {
  getMyProfile: () =>
    api.get<{ data:  UserProfile , success: boolean  }>(`/users/me`),

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

  /**
   * Uploads a File to Cloudinary via /api/users/me/image.
   * The server deletes the user's current avatar/banner on Cloudinary first
   * (only if it's one of ours), then uploads the new one and saves the URL.
   * Returns the new, already-persisted URL.
   */
  uploadImage: async (field: 'avatar' | 'banner', file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('field', field);

    // Uses fetch directly (not ApiCore) since this is a multipart body, not JSON.
    const res = await fetch('/api/users/me/image', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json?.data?.url) {
      throw new Error(json?.error ?? `Couldn't upload ${field}.`);
    }
    return json.data.url as string;
  },

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