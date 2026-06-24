// app/services/forum.ts
import ForumApi from '../ApiCore';
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
export const ForumService = {
  getStats: () => api.get<ApiResponse>('/forum/stats'),
};