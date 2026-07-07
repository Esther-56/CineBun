// services/announcements.ts
import ForumApi from '../ApiCore';

const api = new ForumApi();

export interface Announcement {
  _id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  createdBy: { _id: string; username: string } | string;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementInput {
  message: string;
  type?: Announcement['type'];
  isActive?: boolean;
  notifyByEmail?: boolean; // create-only, ignored server-side on update
  durationHours?: number;
  expiresAt?: string;
  startsAt?: string;
}

export const AnnouncementService = {
  listActive: () =>
    api.get<{ success: boolean; data: { announcements: Announcement[] } }>('/announcements'),

  listAll: () =>
    api.get<{ success: boolean; data: { announcements: Announcement[] } }>('/admin/announcements'),

  create: (data: AnnouncementInput) =>
    api.post<{ success: boolean; data: { announcement: Announcement } }>('/announcements', data),

  update: (id: string, data: Partial<AnnouncementInput>) =>
    api.patch<{ success: boolean; data: { announcement: Announcement } }>(`/announcements/${id}`, data),

  delete: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/announcements/${id}`),

  deactivate: (id: string) =>
    api.patch<{ success: boolean; data: { announcement: Announcement } }>(`/announcements/${id}`, { isActive: false }),
};