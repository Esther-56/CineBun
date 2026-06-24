// app/services/category-service.ts
import ForumApi from '../ApiCore';
import { AvatarEffectKey } from '../MainPage/trendingThreads/components/Avatar';
import { UsernameEffectKey } from '../u/[username]/components/ui/UsernameEffect';
const api = new ForumApi();

// Matches the backend's ok()/created()/fail() envelope — every response is wrapped like this.
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LastPost {
  username: string;
  avatar: string;
  timeAgo: string;
  threadTitle: string;
  usernameEffect:UsernameEffectKey;
  avatarEffect:AvatarEffectKey;
}

export interface ApiSubforum {
  _id: string;
  name: string;
  description?: string;
  order: number;
  icon?: string;
  accentColor: string;
  threadCount: number;
  postCount: number;
  lastPost: LastPost;
  isReadOnly?: boolean;
  isNew?: boolean;
  category: string;
  updatedAt:Date;
  leadsToThreads:boolean
}

export interface ApiCategory {
  _id: string;
  name: string;
  description?: string;
  order: number;
  icon?: string;
  accentColor: string;
  subforums: ApiSubforum[];
  threadCount: number;
  postCount: number;
  lastPost: LastPost;
  isReadOnly?: boolean;
  isNew?: boolean;
  category: string;
}

// Payload for creating/updating a category — only the fields an admin can actually set.
export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string | null;
  order?: number;
  accentColor?:string;
}

export const CategoryService = {

  list: () => api.get<ApiResponse<ApiCategory[]>>('/categories'),

  get: (id: string) => api.get<ApiResponse<ApiCategory>>(`/categories/${id}`),

  create: (input: CategoryInput) =>
    api.post<ApiResponse<ApiCategory>>('/categories', input),

  update: (id: string, input: Partial<CategoryInput>) =>
    api.patch<ApiResponse<ApiCategory>>(`/categories/${id}`, input),

  delete: (id: string) =>
    api.delete<ApiResponse<{ deleted: true }>>(`/categories/${id}`),
};