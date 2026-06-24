"use client";
import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, ChevronDown, ChevronRight, Pencil, SmilePlus,
  CornerUpLeft, Link as LinkIcon, Check, Trash2, AlertTriangle, X,
} from 'lucide-react';
import ReplyBox from './ReplyBox';
import { RichEditor } from "@/app/MainPage/trendingThreads/threadcomponent/RichEditor";
import { PostService } from "@/app/services/posts";
import { Post, ForumUser } from '../../types/forum';
import Avatar from '../components/Avatar';
import UserBadges from './UserBadge';
import { formatTimeAgo } from '@/app/n/component/utils';
import { store } from '@/app/store';
import { useSnapshot } from 'valtio';
import UsernameEffect from '@/app/u/[username]/components/ui/UsernameEffect';

export interface PostNode extends Post {
  children: PostNode[];
  replyingToId?: string;
  replyingToName?: string;
}

export interface UserBadge {
  id: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'special';
}

interface PostCardProps {
  post: PostNode;
  threadId: string;
  isLocked?: boolean;
  depth?: number;
  postNumber?: number;
  rootPostId?: string;
  badges?: UserBadge[];
  highlightPostId?: string;
  onDeleted?: (id: string) => void;
}

const MAX_VISUAL_DEPTH = 1;
const INDENT_PX = 28;
const INITIAL_VISIBLE_REPLIES = 2;
const REPLIES_PER_REVEAL = 2;

const REACTIONS = [
  { type: 'like',  emoji: '👍', label: 'Like' },
  { type: 'love',  emoji: '❤️', label: 'Love' },
  { type: 'haha',  emoji: '😂', label: 'Haha' },
  { type: 'wow',   emoji: '😮', label: 'Wow' },
  { type: 'sad',   emoji: '😢', label: 'Sad' },
  { type: 'angry', emoji: '😡', label: 'Angry' },
] as const;

type ReactionType = (typeof REACTIONS)[number]['type'];

function getRoleBadgeStyle(role?: string): { bg: string; text: string } {
  switch (role?.toLowerCase()) {
    case 'admin':     return { bg: '#3a1a1a', text: '#ff6b6b' };
    case 'moderator': return { bg: '#1a2a3a', text: '#4b8ef1' };
    case 'senior':    return { bg: '#1a2a1a', text: '#4caf7d' };
    case 'member':    return { bg: '#2a1a3a', text: '#b07ef1' };
    default:          return { bg: '#242526',  text: '#8a8d91' };
  }
}

function PostNumberBadge({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="text-[12px] font-mono text-(--text-secondary) select-none">#{n}</span>
  );
}

function flashHighlight(el: HTMLElement) {
  el.classList.add('ring-2', 'ring-(--accent)', 'ring-offset-2', 'ring-offset-(--bg-page)');
  window.setTimeout(() => {
    el.classList.remove('ring-2', 'ring-(--accent)', 'ring-offset-2', 'ring-offset-(--bg-page)');
  }, 1400);
}

function scrollToPost(id: string) {
  const el = document.getElementById(`post-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  flashHighlight(el);
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-(--bg-surface) border border-(--border-medium) rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-(--danger-subtle) shrink-0">
            <AlertTriangle size={15} className="text-(--danger)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--text-primary) mb-1">Delete this post?</p>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              {"This action can't be undone. The post will be permanently removed."}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-3.5 rounded-lg text-xs text-(--text-secondary) bg-(--bg-input) border border-(--border-soft) hover:border-(--border-medium) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-(--danger) hover:bg-[#d94f4f] transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={11} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  threadId,
  isLocked,
  depth = 0,
  postNumber,
  rootPostId,
  highlightPostId,
  onDeleted,
}: PostCardProps) {
  const [children, setChildren]               = useState<PostNode[]>(post.children ?? []);
  const [content, setContent]                 = useState(post.content);
  const [editedAt, setEditedAt]               = useState(post.editedAt);
  const [deleted, setDeleted]                 = useState(false);
  const [replying, setReplying]               = useState(false);
  const [editing, setEditing]                 = useState(false);
  const [editReason, setEditReason]           = useState("");
  const [collapsed, setCollapsed]             = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState("");
  const [reactions, setReactions]             = useState<Record<string, number>>(post.reactionCount ?? {});
  const [myReaction, setMyReaction]           = useState<ReactionType | null>(
    REACTIONS.some((r) => r.type === post.myReaction) ? post.myReaction as ReactionType : null
  );
  const [visibleReplies, setVisibleReplies]   = useState(INITIAL_VISIBLE_REPLIES);
  const [copied, setCopied]                   = useState(false);
  const snap = useSnapshot(store)
  const id = snap._id
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);
  const isAuthor   = snap?._id === post?.author?._id;
  const canEditAny = snap.role?.permissions?.canEditAnyPost;
  const canEditOwn = snap.role?.permissions?.canEditOwnPost;
  const canEdit    = Boolean(canEditAny || (isAuthor && canEditOwn));

  const canDeleteAny = snap.role?.permissions?.canDeleteAnyPost;
  const canDeleteOwn = snap.role?.permissions?.canDeleteOwnPost;
  const canDelete    = Boolean(canDeleteAny || (isAuthor && canDeleteOwn));

  type UserRole = string | { name?: string } | undefined;
  const author   = post.author as ForumUser | undefined;
  const roleVal: UserRole = author?.role as UserRole;
  const roleName    = typeof roleVal === 'string' ? roleVal : roleVal?.name ?? 'Member';
  const customTitle = author?.customTitle;
  const badgeStyle  = getRoleBadgeStyle(roleName);

  const isReply        = depth > 0;
  const effectiveRootId = rootPostId ?? post._id;
  const showJumpPill   = isReply && !!post.replyingToId && post.replyingToId !== effectiveRootId;

  const visualDepth       = Math.min(depth, MAX_VISUAL_DEPTH);
  const indent            = visualDepth * INDENT_PX;
  const flattenedReplies  = flattenChildren(children);
  const visibleChildren   = flattenedReplies.slice(0, visibleReplies);
  const hiddenCount       = flattenedReplies.length - visibleReplies;

  function handleReplyCreated(newPost: Post) {
    setChildren((prev) => [...prev, { ...newPost, children: [] }]);
    setReplying(false);
    setVisibleReplies((v) => v + 1);
  }

  async function handleEditSubmit(html: string) {
    const result = await PostService.update(post._id, {
      content: html,
      editReason: editReason.trim() || undefined,
    }) as { data: Post; success: boolean };
    const { data, success } = result;
    if (!success) throw new Error("Failed to update post");
    setContent(data.content);
    setEditedAt(data.editedAt);
    setEditing(false);
    setEditReason("");
  }

  async function handleDeleteConfirm() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const result = await PostService.delete(post._id) as { success: boolean; data?: { message: string } };
      if (!result.success) {
        setDeleteError("Failed to delete post. Please try again.");
        setDeleteLoading(false);
        return;
      }
      setShowDeleteModal(false);
      setDeleted(true);
      onDeleted?.(post._id);
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleteLoading(false);
    }
  }

  async function handleReact(type: ReactionType) {

    const prevReaction = myReaction;
    const prevReactions = reactions;
    const next = { ...prevReactions };

    if (prevReaction === type) {
      next[type] = Math.max(0, (next[type] ?? 0) - 1);
      setReactions(next);
      setMyReaction(null);
    } else {
      if (prevReaction) next[prevReaction] = Math.max(0, (next[prevReaction] ?? 0) - 1);
      next[type] = (next[type] ?? 0) + 1;
      setReactions(next);
      setMyReaction(type);
    }
    setShowEmojiPicker(false);

    try {
      const result = await PostService.react(post._id, type) as {
        data: { toggled: boolean; type: ReactionType };
        success: boolean;
      };
      if (!result.success) throw new Error("Reaction failed");
      const { toggled, type: confirmedType } = result.data;
      setMyReaction(toggled ? confirmedType : null);
    } catch {
      setReactions(prevReactions);
      setMyReaction(prevReaction);
    }
  }

  function sanitizePostLinks(html: string): string {
  return html.replace(
    /<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/gi,
    (match, before, href, after) => {
      if (href.startsWith("/leaving")) return match;
      const safe = `/leaving?site=${encodeURIComponent(href)}`;
      return `<a ${before}href="${safe}"${after}>`;
    }
  );
}

  async function handleCopyLink() {
    const url = `${window.location.origin}${window.location.pathname}?post=${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard can fail silently on non-https
    }
  }

  useEffect(() => {
    if (!highlightPostId || highlightPostId !== post._id) return;
    setCollapsed(false);
    const t = setTimeout(() => scrollToPost(post._id), 150);
    return () => clearTimeout(t);
  }, [highlightPostId, post._id]);

  useEffect(() => {
    if (!highlightPostId) return;
    const idx = flattenedReplies.findIndex((p) => p._id === highlightPostId);
    if (idx === -1) return;
    setCollapsed(false);
    if (idx >= visibleReplies) setVisibleReplies(idx + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightPostId, children]);

  // Soft-deleted: render a minimal tombstone
  if (deleted) {
    return (
      <div
        style={{ marginLeft: indent }}
        className={`${isReply ? "border-l-2 border-(--border-soft) pl-3" : ""}`}
      >
        <div className="bg-(--bg-input) border border-(--border-soft) rounded-lg px-4 py-3 flex items-center gap-2">
          <Trash2 size={12} className="text-(--text-muted)" />
          <span className="text-xs text-(--text-muted) italic">This post has been deleted.</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(""); }}
          loading={deleteLoading}
        />
      )}

      <div
        id={`post-${post._id}`}
        style={{ marginLeft: indent }}
        className={`${isReply ? "border-l-2 border-(--border-soft) pl-3" : ""} rounded-lg transition-shadow duration-300`}
      >
        <div className="bg-(--bg-surface) border border-(--border-soft) rounded-lg overflow-hidden">

          {/* ── Sidebar + Body ──────────────────────────────────── */}
          <div className="flex">

            {/* Left sidebar (top-level posts only, sm+) */}
            {!isReply && (
              <div className="hidden sm:flex flex-col items-center gap-1.5 px-3 py-3 bg-(--bg-input) border-r border-(--border-soft) min-w-32 max-w-32">
                <Avatar name={post.author.username} effect={post.author.avatarEffect} src={post.author.avatar} size="lg" />
                <span>
                  <UsernameEffect name={post.author.username} effect={post.author.usernameEffect} className='text-[13px] font-semibold text-center leading-tight break-all'/>
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: badgeStyle.bg, color: badgeStyle.text }}
                >
                  {roleName}
                </span>
                {customTitle && (
                  <span className="text-[11px] text-(--text-primary) italic text-center leading-tight">
                    {customTitle}
                  </span>
                )}
                <UserBadges badges={post.author?.badges} size={13} />
              </div>
            )}

            {/* Main content */}
            <div className={`flex-1 min-w-0 ${isReply ? 'py-1 px-2.5' : 'p-3'}`}>

              {/* Jump-to-parent pill */}
              {showJumpPill && (
                <button
                  onClick={() => scrollToPost(post.replyingToId!)}
                  className="flex items-center gap-1 my-1 text-[12px] text-[#6a8fc2] hover:text-(--accent) mb-1.5 transition-colors"
                >
                  <CornerUpLeft size={10} />
                  replying to <span className="font-semibold">{post.replyingToName ?? 'comment'}</span>
                </button>
              )}

              {/* Header row */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`${isReply ? 'flex' : 'sm:hidden flex'} items-center gap-1.5`}>
                  <Avatar name={post.author.username} effect={post.author.avatarEffect} src={post.author.avatar} size="md" />
                  <UsernameEffect name={post.author.username} effect={post.author.usernameEffect} className='text-xs font-semibold'/>
                  {isReply && <span className="text-xs text-(--accent)">commented</span>}
                </div>

                <span className="text-[11px] font-semibold text-(--text-secondary)">
                  {`${formatTimeAgo(post.createdAt)}`}
                </span>

                {editedAt && (
                  <span className="flex items-center gap-1 text-[12px] text-(--text-primary)">
                    <Pencil size={10} /> edited
                  </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                  {children.length > 0 && (
                    <button
                      onClick={() => setCollapsed((v) => !v)}
                      className="text-(--text-secondary) hover:text-(--text-muted) transition-colors"
                      aria-label={collapsed ? 'Expand thread' : 'Collapse thread'}
                    >
                      {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </button>
                  )}
                  {!isReply && <PostNumberBadge n={postNumber} />}
                </div>
              </div>

              {/* Content / edit form */}
              {!collapsed && (
                editing ? (
                  <div>
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      placeholder="Reason for edit (optional)"
                      className="w-full mb-2 bg-(--bg-input) border border-(--border-soft) rounded-lg px-3 py-2 text-xs text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
                    />
                    <RichEditor
                      initialContent={content}
                      submitLabel="Save"
                      onSubmit={handleEditSubmit}
                      onCancel={() => { setEditing(false); setEditReason(""); }}
                      height={'min-h-40'}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 justify-between">
                                  <div
                  className={`prose-dark ${isReply ? 'text-[13px]' : 'text-[15px]'} font-medium text-(--text-primary) leading-relaxed ${isReply ? 'mb-1' : 'mb-8'}`}
                  dangerouslySetInnerHTML={{ __html: sanitizePostLinks(content) }}
                />

                    {id&&<div>
                      {/* Reaction bubbles */}
                      {Object.keys(reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {REACTIONS.filter((r) => (reactions[r.type] ?? 0) > 0).map((r) => (
                            <button
                              key={r.type}
                              onClick={() => handleReact(r.type)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                                myReaction === r.type
                                  ? 'bg-[#1a2a3a] border-(--accent) text-(--accent)'
                                  : 'bg-(--bg-input) border-(--border-soft) text-(--text-muted) hover:border-(--border-medium)'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{reactions[r.type]}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action bar */}
                      <div className={`flex items-center gap-3 ${isReply ? "pt-1 mt-0" : "mt-2.5 pt-2"} border-t border-(--border-soft)`}>

                        {!isLocked && (
                          <button
                            onClick={() => setReplying((v) => !v)}
                            className="flex items-center cursor-pointer gap-1  font-medium text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors"
                          >
                            <MessageSquare size={12} />
                            Reply
                          </button>
                        )}

                        {/* Emoji picker */}
                        <div className="relative" ref={emojiRef}>
                          <button
                            onClick={() => setShowEmojiPicker((v) => !v)}
                            className="flex items-center cursor-pointer font-medium  gap-1 text-[13px] text-(--text-secondary) hover:text-(--accent) transition-colors"
                          >
                            <SmilePlus size={12} />
                            React
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-(--bg-input) border border-(--border-medium) rounded-lg px-2 py-1.5 shadow-xl z-10">
                              {REACTIONS.map((r) => (
                                <button
                                  key={r.type}
                                  onClick={() => handleReact(r.type)}
                                  title={r.label}
                                  className={`text-base hover:scale-125 font-medium  transition-transform ${myReaction === r.type ? 'scale-125' : ''}`}
                                >
                                  {r.emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit */}
                        {canEdit && (
                          <button
                            onClick={() => { setEditing(true); setReplying(false); }}
                            className="flex items-center gap-1 font-medium  text-[13px] text-(--text-muted) hover:text-(--accent) transition-colors"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        )}

                        {/* Delete */}
                        {canDelete && (
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1 text-[13px] text-(--text-muted) hover:text-(--danger) transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}

                        {/* Delete error (inline fallback) */}
                        {deleteError && (
                          <span className="flex items-center gap-1 text-[11px] text-(--danger)">
                            <X size={10} />
                            {deleteError}
                          </span>
                        )}

                        {/* Copy link */}
                        <button
                          onClick={handleCopyLink}
                          title="Copy link to this post"
                          className="flex items-center cursor-pointer gap-1 text-[12px] text-(--text-secondary) hover:text-(--accent) transition-colors ml-auto"
                        >
                          {copied ? <Check size={12} /> : <LinkIcon size={12} />}
                        </button>
                      </div>

                      {replying && (
                        <div className="mt-2">
                          <ReplyBox
                            threadId={threadId}
                            parentPost={post._id}
                            onPostCreated={handleReplyCreated}
                            onCancel={() => setReplying(false)}
                            compact
                          />
                        </div>
                      )}
                    </div>}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Replies ───────────────────────────────────────────── */}
        {!collapsed && flattenedReplies.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {visibleChildren.map((child) => (
              <PostCard
                key={child._id}
                post={child}
                threadId={threadId}
                isLocked={isLocked}
                depth={1}
                postNumber={undefined}
                rootPostId={effectiveRootId}
                highlightPostId={highlightPostId}
                onDeleted={(id) => {
                  setChildren((prev) => prev.filter((c) => c._id !== id));
                  onDeleted?.(id);
                }}
              />
            ))}

            {hiddenCount > 0 && (
              <button
                onClick={() => setVisibleReplies((v) => v + REPLIES_PER_REVEAL)}
                className="self-start ml-4 text-[11px] text-(--accent) hover:text-(--accent-hover) transition-colors flex items-center gap-1"
              >
                <ChevronDown size={12} />
                Show more ({hiddenCount} {hiddenCount === 1 ? 'reply' : 'replies'} hidden)
              </button>
            )}

            {hiddenCount <= 0 && visibleReplies > INITIAL_VISIBLE_REPLIES && (
              <button
                onClick={() => setVisibleReplies(INITIAL_VISIBLE_REPLIES)}
                className="self-start ml-4 text-[11px] text-(--text-muted) hover:text-(--text-primary) transition-colors flex items-center gap-1"
              >
                <ChevronRight size={12} />
                Hide replies
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function flattenChildren(nodes: PostNode[]): PostNode[] {
  const out: PostNode[] = [];
  function walk(list: PostNode[]) {
    for (const node of list) {
      out.push({ ...node, children: [] });
      if (node.children?.length) walk(node.children);
    }
  }
  walk(nodes);
  return out.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}