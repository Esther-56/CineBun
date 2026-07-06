// services/posts.ts
import ForumApi from '../ApiCore';
import { Post } from '../MainPage/types/forum';
const api = new ForumApi();

export const PostService = {
  // Page 1 = first 20 top-level posts + all their nested replies
  list: (threadId: string, page = 1) =>
    api.get(`/threads/${threadId}/posts`, { page, limit: 20 }),

  // parentPost omitted → top-level reply. Set it → Reddit-style reply attached to that post.
  create: (threadId: string, body: { content: string; quotedPostId?: string; parentPost?: string }) =>
    api.post(`/posts`, { threadId, ...body }),

  update: (postId: string, body: { content: string; editReason?: string }) =>
    api.patch(`/posts/${postId}`, body),

  delete: (postId: string) =>
    api.delete(`/posts/${postId}`),

  // services/posts.ts — add this
    locate: (threadId: string, postId: string) =>
      api.get<{ success: boolean; data: { page: number; rootPostId: string } }>(
        '/posts/locate',
        { threadId, postId }
      ),

  react: (postId: string, type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') =>
    api.post(`/posts/${postId}/reactions`, { type }),
  poll: (threadId: string, since: string) =>
    api.get<{
      success: boolean;
      data: { posts: Post[]; newTopLevelCount: number; latestCreatedAt: string };
    }>(`/threads/${threadId}/posts/poll`, { since }),
};