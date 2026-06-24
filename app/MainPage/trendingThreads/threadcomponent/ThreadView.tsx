"use client";
import { useState } from 'react';
import { Lock } from 'lucide-react';
import PostList from './PostList';
import ReplyBox from './ReplyBox';
import { Post, Thread } from '../../types/forum';
import { useSnapshot } from 'valtio';
import { store } from '@/app/store';

interface ThreadViewProps {
  thread: Thread;
  initialPosts: Post[];
  highlightPostId?: string;
}

export default function ThreadView({ thread, initialPosts, highlightPostId }: ThreadViewProps) {
  const [posts, setPosts] = useState(initialPosts);
  const snap = useSnapshot(store)
  const id = snap._id
  function handlePostCreated(post: Post) {
    setPosts(prev => [...prev, post]);
  }

  return (
    <div className="flex flex-col gap-4">
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