// app/services/mediaResources.ts
import ForumApi from '../ApiCore'; // your existing Axios wrapper

export type MediaCategory = 'video' | 'image' | 'audio' | 'other';

export interface MediaResource {
  _id: string;
  name: string;
  url: string;
  description?: string;
  category: MediaCategory;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaResourceInput {
  name: string;
  url: string;
  description?: string;
  category: MediaCategory;
  isPinned?: boolean;
}

const api = new ForumApi();
export const MediaResourceService = {
  listAll: () => api.get<{ resources: MediaResource[] }>('/media-resources'),
  listPublic: () => api.get<{ resources: MediaResource[] }>('/media-resources/public'),
  create: (data: MediaResourceInput) => api.post<{ resource: MediaResource}>('/media-resources', data),
  update: (id: string, data: Partial<MediaResourceInput>) =>
  api.patch<{ resource: MediaResource }>(`/media-resources/${id}`, data),
  delete: (id: string) => api.delete(`/media-resources/${id}`),
};