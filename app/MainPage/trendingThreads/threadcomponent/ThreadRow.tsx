/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Pin, Lock, MessageSquare, Eye, Pencil, Trash2,
  AlertTriangle, X, ChevronDown, ImageIcon as ImageLucide,
  AlertCircle, Loader2, Save, LockOpen,
} from 'lucide-react';
import Avatar from '../components/Avatar';
import { formatNumber, prefixStyles } from '../../Interfaces/lib/utils';
import { Thread } from '../../types/forum';
import { formatTimeAgo } from '@/app/n/component/utils';
import { ThreadService, ThreadUpdateBody } from '@/app/services/threads';
import { store } from '@/app/store';
import { useSnapshot } from 'valtio';
import { useRouter } from 'nextjs-toploader/app';
import UsernameEffect from '@/app/u/[username]/components/ui/UsernameEffect';

interface ThreadRowProps {
  thread: Thread;
  accentColor: string;
  subforumId: string;
  currentUserId?: string;
  currentUserRole?: {
    permissions?: {
      canDeleteAnyPost?: boolean;
      canEditAnyPost?: boolean;
    };
  };
  onDeleted?: (id: string | undefined) => void;
  onUpdated?: (id: string | undefined, patch: ThreadUpdateBody) => void;
}

const MAX_TAGS = 5;

const PREFIXES = [
  { value: "Discussion", color: "#1877f2", desc: "General conversation" },
  { value: "Question",   color: "#e69c00", desc: "Seeking help or answers" },
  { value: "Guide",      color: "#1ca35e", desc: "Tutorial or how-to" },
  { value: "News",       color: "#c43f3f", desc: "Announcements & updates" },
  { value: "Poll",       color: "#9b5de5", desc: "Community vote" },
];

function DeleteModal({ onConfirm, onCancel, loading, error }: {
  onConfirm: () => void; onCancel: () => void; loading: boolean; error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-(--bg-surface) border border-(--border-medium) rounded-xl w-full max-w-sm mx-4 p-5 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-[#ff6b6b]/10 shrink-0">
            <AlertTriangle size={15} className="text-[#ff6b6b]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--text-primary) mb-1">Delete this thread?</p>
            <p className="text-xs text-(--text-secondary) leading-relaxed">
              This will permanently remove the thread and all its replies.
            </p>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ff6b6b] text-xs px-3 py-2 rounded-lg mb-3">
            <X size={12} /> {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-3.5 rounded-lg text-xs text-(--text-secondary) bg-(--bg-page) border border-(--border-soft) hover:border-(--border-medium) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold text-white bg-[#c43f3f] hover:bg-[#d94f4f] transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {loading
              ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Deleting…</>
              : <><Trash2 size={11} />Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleTile({ active, onToggle, icon, label, description, activeColor, activeBg }: {
  active: boolean; onToggle: () => void; icon: React.ReactNode;
  label: string; description: string; activeColor: string; activeBg: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-all text-left ${
        active ? 'border-current bg-opacity-10' : 'border-(--border-soft) bg-(--bg-surface) hover:border-(--border-medium)'
      }`}
      style={active ? { borderColor: activeColor, backgroundColor: activeBg, color: activeColor } : {}}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${active ? 'bg-white/10' : 'bg-(--bg-page)'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${active ? '' : 'text-(--text-primary)'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${active ? 'opacity-70' : 'text-(--text-muted)'}`}>{description}</p>
      </div>
      <div
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${active ? '' : 'bg-(--bg-elevated)'}`}
        style={active ? { backgroundColor: activeColor } : {}}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}

function EditModal({ thread, canModerate, onSaved, onCancel }: {
  thread: Thread; canModerate: boolean;
  onSaved: (patch: ThreadUpdateBody) => void; onCancel: () => void;
}) {
  const [fetchLoading, setFetchLoading]   = useState(true);
  const [fetchError, setFetchError]       = useState("");
  const [submitError, setSubmitError]     = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [title, setTitle]           = useState(thread.title ?? "");
  const [prefix, setPrefix]         = useState(thread.prefix ?? "");
  const [tags, setTags]             = useState<string[]>(thread.tags ?? []);
  const [tagInput, setTagInput]     = useState("");
  const [image, setImage]           = useState(thread.image ?? "");
  const [imageError, setImageError] = useState("");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [isPinned, setIsPinned]     = useState(thread.isPinned ?? false);
  const [isLocked, setIsLocked]     = useState(thread.isLocked ?? false);
  const prefixRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prefixRef.current && !prefixRef.current.contains(e.target as Node)) setPrefixOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  useEffect(() => {
    (async () => {
      try {
        const result = await ThreadService.getById(thread._id);
        if (!result.success) { setFetchError("Showing cached values — couldn't refresh from server."); return; }
        const t = result.data;
        setTitle(t.title ?? thread.title ?? "");
        setImage(t.image ?? thread.image ?? "");
        setTags(Array.isArray(t.tags) ? t.tags : (thread.tags ?? []));
        setPrefix(t.prefix ?? thread.prefix ?? "");
        setIsPinned(t.isPinned ?? thread.isPinned ?? false);
        setIsLocked(t.isLocked ?? thread.isLocked ?? false);
      } catch {
        setFetchError("Showing cached values — couldn't refresh from server.");
      } finally {
        setFetchLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread._id]);

  const addTag = (raw: string) => {
    const value = raw.trim().replace(/,$/, "");
    if (!value || tags.length >= MAX_TAGS) return;
    if (tags.some(t => t.toLowerCase() === value.toLowerCase())) { setTagInput(""); return; }
    setTags(prev => [...prev, value]);
    setTagInput("");
  };

  const removeTag = (value: string) => setTags(prev => prev.filter(t => t !== value));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length) removeTag(tags[tags.length - 1]);
  };

  const handleSaveClick = async () => {
    setSubmitError("");
    if (!title.trim()) { setSubmitError("Please enter a title."); return; }
    if (!image.trim()) { setSubmitError("Please enter an image link."); return; }
    setSubmitLoading(true);
    try {
      const payload: ThreadUpdateBody = {
        title: title.trim(), image: image.trim(), tags, prefix: prefix || undefined,
        ...(canModerate && { isPinned, isLocked }),
      };
      const result = await ThreadService.update(thread._id, payload);
      if (!result.success) { setSubmitError("Failed to save changes. Please try again."); return; }
      onSaved(payload);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedPrefix = PREFIXES.find(p => p.value === prefix);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-(--bg-page) border border-(--border-medium) rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-(--border-soft) shrink-0">
          <h2 className="text-sm font-semibold text-(--text-primary)">Edit Thread</h2>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/8 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto scrollbar-track-black scrollbar-thumb-white scrollbar-thin flex-1 px-5 py-4">
          {fetchError && (
            <div className="flex items-center gap-2 bg-[#e69c00]/10 border border-[#e69c00]/25 text-[#e69c00] text-xs px-3 py-2 rounded-lg mb-3">
              <AlertCircle size={12} className="shrink-0" /> {fetchError}
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 text-[#ff6b6b] text-sm px-4 py-3 rounded-lg mb-3">
              <X size={14} className="shrink-0" /> {submitError}
            </div>
          )}

          <div className="space-y-4">

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-(--text-muted) font-semibold">Title</label>
              <input
                type="text"
                placeholder="Thread title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full h-10 px-3 bg-(--bg-surface) border border-(--border-soft) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none focus:border-(--accent) transition-colors"
              />
            </div>

            {/* Prefix */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-(--text-muted) font-semibold">Prefix</label>
              <div className="relative" ref={prefixRef}>
                <button
                  type="button"
                  onClick={() => setPrefixOpen(o => !o)}
                  className={`flex items-center gap-2 w-full h-10 px-3 bg-(--bg-surface) border rounded-lg text-sm transition-colors ${
                    prefixOpen ? 'border-(--accent)' : 'border-(--border-soft) hover:border-(--border-medium)'
                  }`}
                  aria-haspopup="listbox"
                  aria-expanded={prefixOpen}
                >
                  {selectedPrefix && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: selectedPrefix.color }} />}
                  <span className={`flex-1 text-left ${!prefix ? 'text-(--text-secondary)' : 'text-(--text-primary)'}`}>
                    {prefix || "Select a prefix… (optional)"}
                  </span>
                  {prefix && (
                    <span
                      role="button"
                      aria-label="Clear prefix"
                      onClick={(e) => { e.stopPropagation(); setPrefix(""); }}
                      className="flex items-center justify-center w-4 h-4 rounded hover:bg-white/10 text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                    >
                      <X size={10} />
                    </span>
                  )}
                  <ChevronDown size={14} className={`text-(--text-secondary) transition-transform duration-150 ${prefixOpen ? 'rotate-180' : ''}`} />
                </button>

                {prefixOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-(--bg-elevated) border border-(--border-medium) rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]" role="listbox">
                    <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-(--text-secondary) font-medium">Thread prefix</div>
                    <button
                      type="button" role="option" aria-selected={prefix === ""}
                      onClick={() => { setPrefix(""); setPrefixOpen(false); }}
                      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                        prefix === "" ? 'bg-(--accent-subtle) text-(--accent)' : 'text-(--text-secondary) hover:bg-white/5'
                      }`}
                    >
                      No prefix
                    </button>
                    {PREFIXES.map(p => (
                      <button
                        key={p.value} type="button" role="option" aria-selected={prefix === p.value}
                        onClick={() => { setPrefix(p.value); setPrefixOpen(false); }}
                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                          prefix === p.value ? 'bg-(--accent-subtle) text-(--accent)' : 'text-(--text-primary) hover:bg-white/5'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                        <span className="flex-1 text-left">{p.value}</span>
                        <span className="text-xs text-(--text-secondary)">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-(--text-muted) font-semibold">Tags</label>
              <div className="flex flex-wrap items-center gap-1.5 min-h-10 px-3 py-1.5 bg-(--bg-surface) border border-(--border-soft) rounded-lg focus-within:border-(--accent) transition-colors">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-(--accent-subtle) text-(--accent) text-xs font-medium pl-2 pr-1 py-1 rounded-md">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:bg-(--accent-subtle) rounded p-0.5 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  placeholder={tags.length ? "" : "Add tags… (press Enter)"}
                  disabled={tags.length >= MAX_TAGS}
                  className="flex-1 min-w-25 bg-transparent text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none disabled:cursor-not-allowed"
                />
              </div>
              <span className="text-[11px] text-(--text-muted)">{tags.length}/{MAX_TAGS} tags · press Enter or comma to add</span>
            </div>

            {/* Image */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-(--text-muted) font-semibold">Image</label>
              <div className={`flex items-center gap-2 h-10 px-3 bg-(--bg-surface) border rounded-lg focus-within:border-(--accent) transition-colors ${
                imageError ? 'border-(--danger)' : 'border-(--border-soft)'
              }`}>
                <ImageLucide size={14} className="text-(--text-secondary) shrink-0" />
                <input
                  type="url"
                  placeholder="Image URL…"
                  value={image}
                  onChange={(e) => { setImage(e.target.value); setImageError(""); }}
                  className="flex-1 bg-transparent text-sm text-(--text-primary) placeholder:text-(--text-secondary) focus:outline-none"
                />
                <span className="text-[10px] uppercase tracking-wide text-(--accent) font-semibold shrink-0">Required</span>
              </div>
              {imageError && (
                <span className="flex items-center gap-1 text-[#ff6b6b] text-xs">
                  <AlertCircle size={12} /> {imageError}
                </span>
              )}
              {image && !imageError && (
                <div className="rounded-lg overflow-hidden border border-(--border-soft)">
                  <img src={image} alt="Thread preview" className="w-full h-36 object-cover"
                    onError={() => setImageError("This image URL couldn't be loaded.")} />
                </div>
              )}
            </div>

            {/* Moderation */}
            {canModerate && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <label className="text-[11px] uppercase tracking-wider text-(--text-muted) font-semibold">Moderation</label>
                  <span className="text-[10px] uppercase tracking-wider text-[#9b5de5] font-bold px-1.5 py-0.5 rounded bg-[#9b5de5]/10 border border-[#9b5de5]/20">Mod</span>
                </div>
                <div className="flex flex-col gap-2">
                  <ToggleTile active={isPinned} onToggle={() => setIsPinned(v => !v)}
                    icon={<Pin size={15} className={isPinned ? "" : "text-(--text-secondary)"} />}
                    label="Pin thread" description="Keeps this thread at the top of the subforum"
                    activeColor="#f59e0b" activeBg="rgba(245,158,11,0.08)" />
                  <ToggleTile active={isLocked} onToggle={() => setIsLocked(v => !v)}
                    icon={isLocked ? <Lock size={15} /> : <LockOpen size={15} className="text-(--text-secondary)" />}
                    label="Lock thread" description="Prevents new replies from being posted"
                    activeColor="#ff6b6b" activeBg="rgba(255,107,107,0.08)" />
                </div>
              </div>
            )}
          </div>

          {fetchLoading && (
            <div className="flex items-center gap-2 mt-4 text-(--text-muted) text-xs">
              <Loader2 size={12} className="animate-spin" /> Refreshing from server…
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-(--border-soft) shrink-0">
          <button
            onClick={onCancel} disabled={submitLoading}
            className="h-8 px-3.5 rounded-lg text-xs text-(--text-secondary) bg-(--bg-surface) border border-(--border-soft) hover:border-(--border-medium) transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick} disabled={submitLoading}
            className="h-8 px-4 rounded-lg text-xs font-semibold text-white bg-(--accent) hover:bg-(--accent-hover) transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {submitLoading
              ? <><Loader2 size={12} className="animate-spin" />Saving…</>
              : <><Save size={11} />Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThreadRow({ thread, accentColor, subforumId, onDeleted, onUpdated }: ThreadRowProps) {
  const prefix = thread.prefix ? prefixStyles[thread.prefix] : null;
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState("");
  const [showEditModal, setShowEditModal]     = useState(false);

  const snap        = useSnapshot(store);
  const isAuthor    = !!snap?._id && snap?._id === thread.author?._id;
  const canDeleteAny = !!snap.role?.permissions?.canDeleteOwnThread;
  const canEditAny   = !!snap.role?.permissions?.canEditAnyPost;
  const canModerate  = !!snap.role?.permissions?.canPinThread || !!snap.role?.permissions?.canLockThread;
  const canDelete    = canDeleteAny;
  const canEdit      = isAuthor || canEditAny;

  async function handleDeleteConfirm() {
    setDeleteLoading(true); setDeleteError("");
    try {
      const result = await ThreadService.delete(thread._id) as { success: boolean };
      if (!result.success) { setDeleteError("Failed to delete thread. Please try again."); setDeleteLoading(false); return; }
      setShowDeleteModal(false);
      onDeleted?.(thread._id);
    } catch {
      setDeleteError("Something went wrong. Please try again.");
      setDeleteLoading(false);
    }
  }

  const handleEditSaved = useCallback((patch: ThreadUpdateBody) => {
    setShowEditModal(false);
    onUpdated?.(thread._id, patch);
  }, [thread._id, onUpdated]);

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(""); }}
          loading={deleteLoading} error={deleteError}
        />
      )}
      {showEditModal && (
        <EditModal thread={thread} canModerate={canModerate} onSaved={handleEditSaved} onCancel={() => setShowEditModal(false)} />
      )}

      <div className="relative flex items-start gap-4 px-4 py-3 hover:bg-(--bg-elevated) transition-colors duration-150 group border-b border-(--border-soft) last:border-b-0">

        <div className="w-0.5 h-10 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: accentColor, opacity: thread.isPinned ? 1 : 0.35 }} />

        <div className="hidden sm:block shrink-0 cursor-pointer"
          onClick={() => router.push(`/f/${subforumId}/${thread._id}?page=1`)}>
          <img src={thread.image ?? ''} alt={thread.title ?? 'thread'}
            className="object-cover rounded-md h-20 w-20" />
        </div>

        <div className="flex-1 min-w-0 font-semibold">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {thread.isPinned && <Pin size={12} className="text-[#f59e0b] shrink-0" />}
            {thread.isLocked && <Lock size={12} className="text-(--text-secondary) shrink-0" />}
            {prefix && (
              <span className="text-[12px] font-bold px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: prefix.bg, color: prefix.color }}>
                {prefix.label}
              </span>
            )}
            <Link
              href={{ pathname: `/f/${subforumId}/${thread._id}`, query: { page: 1 } }}
              className="text-(--text-primary) hover:underline font-semibold text-lg transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {thread.title}
            </Link>
          </div>
          <p className="text-(--text-secondary) font-medium text-[13px] truncate">
            by <span className="text-(--text-primary) font-semibold text-[15px] hover:underline cursor-pointer"
              onClick={() => router.push(`/u/${thread?.author?.username}`)}>
              {thread.author?.username}
            </span>
            {thread?.tags?.length > 0 && (
              <><span className="mx-1.5 text-[13px] ">·</span>{thread.tags.map(t => `#${t}`).join(' ')}</>
            )}
          </p>

          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2 mt-1.5 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditModal(true); }}
                  className="flex items-center gap-1 text-[12px] text-(--text-secondary) hover:text-(--accent) transition-colors"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteError(""); setShowDeleteModal(true); }}
                  className="flex items-center gap-1 text-[11px] text-(--text-secondary) hover:text-[#ff6b6b] transition-colors"
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="hidden sm:flex font-semibold items-center gap-6 shrink-0">
          <div className="text-center w-12">
            <div className="text-(--text-primary) text-base font-semibold flex items-center justify-center gap-1">
              <MessageSquare size={12} className="text-(--text-muted) mr-1" />
              {formatNumber(thread.replyCount)}
            </div>
            <div className="text-(--text-secondary) font-semibold text-[11px] uppercase tracking-wide">Replies</div>
          </div>
          <div className="text-center w-12">
            <div className="text-(--text-primary) text-base font-semibold flex items-center justify-center gap-1">
              <Eye size={12} className="text-(--text-muted) mr-1" />
              {formatNumber(thread.views)}
            </div>
            <div className="text-(--text-secondary)  text-[11px] uppercase tracking-wide">Views</div>
          </div>
        </div>

        <div className="hidden md:flex font-semibold items-center gap-2.5 w-44 shrink-0">
          {thread.lastPost ? (
            <>
              <Avatar name={thread?.lastPost?.user?.username} effect={thread?.lastPost?.user?.avatarEffect} src={thread?.lastPost?.user?.avatar} size="md" />
              <div className="min-w-0">
                <span onClick={() => router.push(`/u/${thread?.lastPost?.user?.username}`)}>
                  <UsernameEffect name={thread.lastPost.user.username} effect={thread.lastPost.user.usernameEffect}
                    className="text-sm truncate font-medium leading-tight cursor-pointer hover:underline" />
                </span>
                <p className="text-(--text-secondary) text-[12px] mt-0.5">{formatTimeAgo(thread.lastPost.createdAt)}</p>
              </div>
            </>
          ) : (
            <p className="text-(--text-muted) text-xs">No replies yet</p>
          )}
        </div>
      </div>
    </>
  );
}