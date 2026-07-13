"use client";
import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import PostList from './PostList';
import ReplyBox from './ReplyBox';
import { Post, Thread } from '../../types/forum';
import { useSnapshot } from 'valtio';
import { store } from '@/app/store';
import { PostService } from '@/app/services/posts';
import PollDisplay from '@/app/components/PollDisplay';


const POLL_INTERVAL_MS = 20000;

interface ThreadViewProps {
  thread: Thread;
  initialPosts: Post[];
  highlightPostId?: string;
  isLastPage?: boolean;
  onNewTopLevelPosts?: (count: number) => void;
  lastPageHref?: string;
}

export default function ThreadView({
  thread,
  initialPosts,
  highlightPostId,
  isLastPage = true,
  onNewTopLevelPosts,
  lastPageHref,
}: ThreadViewProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [pendingCount, setPendingCount] = useState(0);
  const snap = useSnapshot(store);
  const id = snap._id;
  const sinceRef = useRef<string>(new Date().toISOString());

  // Re-sync local state whenever the page's initial posts change
  // (navigating pages, switching threads).
  useEffect(() => {
    setPosts(initialPosts);
    setPendingCount(0);
    const latest = initialPosts.reduce((max, p) => {
      const t = new Date(p.createdAt as unknown as string).getTime();
      return t > max ? t : max;
    }, 0);
    sinceRef.current = latest ? new Date(latest).toISOString() : new Date().toISOString();
  }, [initialPosts]);

  useEffect(() => {
    if (thread?.isLocked) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (document.visibilityState !== 'visible') {
        schedule();
        return;
      }
      try {
        const res = await PostService.poll(thread._id, sinceRef.current);
        if (!cancelled && res?.success && res.data) {
          const { posts: newPosts, newTopLevelCount, latestCreatedAt } = res.data;

          if (newPosts.length) {
            sinceRef.current = latestCreatedAt;

            if (isLastPage) {
              setPosts(prev => {
                const existing = new Set(prev.map(p => p._id));
                const deduped = newPosts.filter(p => !existing.has(p._id));
                return deduped.length ? [...prev, ...deduped] : prev;
              });
            } else {
              setPendingCount(c => c + newPosts.length);
            }

            if (newTopLevelCount && onNewTopLevelPosts) {
              onNewTopLevelPosts(newTopLevelCount);
            }
          }
        }
      } catch {
        // Miss one tick, try again next interval.
      }
      schedule();
    }

    function schedule() {
      if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [thread?._id, thread?.isLocked, isLastPage, onNewTopLevelPosts]);

  function handlePostCreated(post: Post) {
    setPosts(prev => [...prev, post]);
    sinceRef.current = (post.createdAt as unknown as string) ?? sinceRef.current;
  }

  return (
    <div className="flex flex-col gap-4">
      {!isLastPage && pendingCount > 0 && lastPageHref && (
        <a
          href={lastPageHref}
          className="text-center text-base text-(--accent) hover:underline rounded-lg border border-(--border-soft) bg-(--bg-surface) px-4 py-2"
        >
          {pendingCount} new {pendingCount === 1 ? 'post' : 'posts'} — jump to the latest
        </a>
      )}
      {thread?.poll && <PollDisplay threadId={thread._id} poll={thread.poll} />}
      <PostList
        threadId={thread?._id}
        posts={posts}
        isLocked={thread?.isLocked}
        highlightPostId={highlightPostId}
      />

      {thread?.isLocked ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-(--border-soft) bg-(--bg-surface) px-4 py-4 text-(--text-secondary) text-base">
          <Lock size={13} />
          This thread is locked. No replies can be posted.
        </div>
      ) : (
        <>{id &&
         <ReplyBox
          threadId={thread?._id || ""}
          nextPostNumber={posts.length + 1}
          onPostCreated={handlePostCreated}
        />}</>
      )}
    </div>
  );
}