import ForumApi from '../ApiCore';
import { Thread } from '../MainPage/types/forum';

const api = new ForumApi();



export interface t {
  thread:Thread
}

export interface Data {
  data: t;
  success: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
}

export interface PaginatedThreads {
  threads: Thread[];
  total: number;
  page: number;
  pages: number;
}

export interface ThreadPollBody {
  question:     string;
  options:      string[];
  durationDays: number;
}

export interface ThreadUpdateBody {
  title?:   string;
  content?: string;
  image?:   string;
  tags?:    string[];
  prefix?:  string;
}

export const ThreadService = {
  list: (subforumId: string, page = 1) =>
    api.get<ApiResponse<PaginatedThreads>>(`/subforums/${subforumId}/threads`, { page }),

  getById: (threadId: string | undefined) =>
    api.get<ApiResponse<Thread & { content: string; tags: string[]; prefix: string }>>(`/threads/${threadId}`),

  // keep old name as alias so existing callers don't break
  get: (threadId: string) =>
    api.get<Data>(`/threads/${threadId}`),

  create: (body: {
    title:      string;
    content:    string;
    image?:     string;
    subforumId: string;
    categoryId?: string;
    prefix?:    string;
    tags:       string[];
    poll?:      ThreadPollBody;
  }) => api.post<Data>('/threads/new', body),

  update: (threadId: string | undefined, body: ThreadUpdateBody) =>
    api.patch<ApiResponse<Thread>>(`/threads/${threadId}`, body),

  delete: (threadId: string | undefined) =>
    api.delete<ApiResponse<{ deleted: boolean }>>(`/threads/${threadId}`),

  lock: (threadId: string | undefined) =>
    api.patch<ApiResponse<Thread>>(`/threads/${threadId}/lock`),

  pin: (threadId: string | undefined) =>
    api.patch<ApiResponse<Thread>>(`/threads/${threadId}/pin`),

  /**
   * Casts (or changes) the current user's vote on a thread's poll.
   * optionIndex is the zero-based index into the poll's options array.
   */
  votePoll: (threadId: string | undefined, optionIndex: number) =>
    api.patch<ApiResponse<Thread>>(`/threads/${threadId}/vote`, { optionIndex }),


  /**
   * Uploads a File to Cloudinary via /api/upload (the general editor/thread
   * upload route — 1MB cap, PNG/JPEG/WEBP/GIF only, enforced server-side).
   * Unlike UserService.uploadImage, this route does NOT delete any previous
   * image first — it's a plain "upload and get a url back" endpoint, since a
   * thread's old image isn't tied to a single Cloudinary asset the way a
   * user's avatar/banner is. Returns the new url; caller decides what to do
   * with it (here: just fill the `image` field, same as pasting a link).
   */
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json?.data?.url) {
      throw new Error(json?.error ?? "Couldn't upload image.");
    }
    return json.data.url as string;
  },
};