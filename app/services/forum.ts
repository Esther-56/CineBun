// app/services/forum.ts
import ForumApi from '../ApiCore';
import { AvatarEffectKey } from '../MainPage/trendingThreads/components/Avatar';
import { ForumStats } from '../MainPage/types/forum';
import { UsernameEffectKey } from '../u/[username]/components/ui/UsernameEffect';
const api = new ForumApi();


interface TrendingThread {
  _id: string;
  title: string;
  subforum: string;
}



interface OnlineUsersProps {
  users:  {username:string, usernameEffect:UsernameEffectKey}[];
  total: number;
}


export interface T {
 stats: ForumStats;
  onlineUsers: OnlineUsersProps;
  trendingThreads: TrendingThread[];
}

export interface ApiResponse {
  data: T;
  success: boolean;
}


export interface TrendingSubforumRef {
  _id: string;
  name: string;
  accentColor?: string;
}

export interface TrendingAuthorRef {
  _id: string;
  username: string;
  avatar?: string;
  avatarEffect?: AvatarEffectKey;
  usernameEffect?: UsernameEffectKey;
}

export interface TrendingThreadItem {
  _id: string;
  title: string;
  prefix?: string;
  image?: string;
  views?: number;
  tags?: string[];
  createdAt: Date;
  activityCount: number;
  author?: TrendingAuthorRef;
  subforum?: TrendingSubforumRef;
}

export interface TrendingPageData {
  items: TrendingThreadItem[];
  total: number;
  page: number;
  pages: number;
}

export interface TrendingPageResponse {
  data: TrendingPageData;
  success: boolean;
}
export const ForumService = {
  getStats: () => api.get<ApiResponse>('/forum/stats'),
  getTrending: (page = 1) => api.get<TrendingPageResponse>(`/forum/trending?page=${page}`)
};