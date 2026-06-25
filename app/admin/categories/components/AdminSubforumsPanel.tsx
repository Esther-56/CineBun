'use client';
import { useState, useEffect,useMemo  } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Plus, Check, X,  Trash2, ChevronUp, ChevronDown,
  AlertTriangle, Loader2, MessageSquare, Layers, Lock,
  EyeOff, ChevronRight, ChevronDown as ChevronDownIcon,
  Megaphone, HelpCircle, Star, Flag, BookOpen, Wrench,
  Gamepad2, Music, Image as ImageIcon, Globe, Hash,
  HelpCircle as UnknownIconFallback,
  Users, UserCheck, UserPlus, Shield, ShieldCheck, Crown,
  Gavel, ScrollText, Bell, BellRing, Pin, Bookmark,
  ThumbsUp, ThumbsDown, Heart, Flame, Zap, Trophy,
  Video, Camera, Tv, Film, Clapperboard, Mic,
  Image, FileImage, GalleryHorizontal, PlayCircle,
  Link, Globe2, Share2, ExternalLink, AtSign, Tag,
  ShoppingBag, Banknote, ArrowLeftRight, Package, Store,
  Lightbulb, LifeBuoy, GraduationCap, Newspaper, Search,
  Settings, Layout, FolderOpen, Eye, Unlock,
  Rocket, Sparkles, Rainbow, Moon, Sun, Box, PenLine,
    Sword, Swords, Skull, Ghost, Wand2, Wand,
  Dice1, Dice5, Joystick, Puzzle, ChessKnight, Target,
  Headphones, Radio, Drum, Guitar, Piano, Disc,
  Brush, Palette, Pen, Pencil, Eraser, Crop,
  Code, Code2, Terminal, Database, Server, Cpu,
  Coffee, Pizza, Apple, Beef, Wine, Beer,
  Car, Plane, Ship, Train, Bike, Footprints,
  Mountain, Trees, Flower2, Leaf, Cloud, Waves,
  
} from 'lucide-react';
import { SubforumService, type ApiSubforumFull, type SubforumInput } from '@/app/services/subforum-service';
import { getErrorMessage } from '@/app/admin/categories/lib/apiError';
import { CategoryService } from '@/app/services/category-service';
import CategoryIcon from '@/app/Lucide';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  categoryId: string;
  categoryName: string;
}

// ── Icon options ──────────────────────────────────────────────────────────────
const ICON_PRESETS = [
  'MessageSquare', 'Layers', 'Megaphone', 'HelpCircle', 'Star', 'Flag',
  'BookOpen', 'Wrench', 'Gamepad2', 'Music', 'ImageIcon', 'Globe', 'Hash',
  'Users', 'UserCheck', 'UserPlus', 'Shield', 'ShieldCheck', 'Crown',
  'Gavel', 'ScrollText', 'Bell', 'BellRing', 'Pin', 'Bookmark',
  'ThumbsUp', 'ThumbsDown', 'Heart', 'Flame', 'Zap', 'Trophy',
  'Video', 'Camera', 'Tv', 'Film', 'Clapperboard', 'Mic',
  'Image', 'FileImage', 'GalleryHorizontal', 'PlayCircle',
  'Link', 'Globe2', 'Share2', 'ExternalLink', 'AtSign', 'Tag',
  'ShoppingBag', 'Banknote', 'ArrowLeftRight', 'Package', 'Store',
  'Lightbulb', 'LifeBuoy', 'GraduationCap', 'Newspaper', 'Search',
  'Settings', 'Layout', 'FolderOpen', 'Eye', 'Lock', 'Unlock',
  'Rocket', 'Sparkles', 'Rainbow', 'Moon', 'Sun', 'Box', 'PenLine',

  // Batch 3
  'Sword', 'Swords', 'Skull', 'Ghost', 'Wand2', 'Wand',
  'Dice1', 'Dice5', 'Joystick', 'Puzzle', 'ChessKnight', 'Target',
  'Headphones', 'Radio', 'Drum', 'Guitar', 'Piano', 'Disc',
  'Brush', 'Palette', 'Pen', 'Pencil', 'Eraser', 'Crop',
  'Code', 'Code2', 'Terminal', 'Database', 'Server', 'Cpu',
  'Coffee', 'Pizza', 'Apple', 'Beef', 'Wine', 'Beer',
  'Car', 'Plane', 'Ship', 'Train', 'Bike', 'Footprints',
  'Mountain', 'Trees', 'Flower2', 'Leaf', 'Cloud', 'Waves',
];

const PRESET_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  // Original
  MessageSquare, Layers, Megaphone, HelpCircle, Star, Flag,
  BookOpen, Wrench, Gamepad2, Music, ImageIcon, Globe, Hash,

  // Forum / Community
  Users, UserCheck, UserPlus, Shield, ShieldCheck, Crown,
  Gavel, ScrollText, Bell, BellRing, Pin, Bookmark,
  ThumbsUp, ThumbsDown, Heart, Flame, Zap, Trophy,

  // Content
  Video, Camera, Tv, Film, Clapperboard, Mic,
  Image, FileImage, GalleryHorizontal, PlayCircle,

  // Platform / Social
  Link, Globe2, Share2, ExternalLink, AtSign, Tag,

  // Commerce
  ShoppingBag, Banknote, ArrowLeftRight, Package, Store,

  // Utility / Nav
  Lightbulb, LifeBuoy, GraduationCap, Newspaper, Search,
  Settings, Layout, FolderOpen, Eye, Lock, Unlock,

  // Misc
  Rocket, Sparkles, Rainbow, Moon, Sun, Box, PenLine,
    Sword, Swords, Skull, Ghost, Wand2, Wand,
  Dice1, Dice5, Joystick, Puzzle, ChessKnight, Target,
  Headphones, Radio, Drum, Guitar, Piano, Disc,
  Brush, Palette, Pen, Pencil, Eraser, Crop,
  Code, Code2, Terminal, Database, Server, Cpu,
  Coffee, Pizza, Apple, Beef, Wine, Beer,
  Car, Plane, Ship, Train, Bike, Footprints,
  Mountain, Trees, Flower2, Leaf, Cloud, Waves,
};

// Resolves any valid lucide-react PascalCase icon name (not just presets).
// e.g. "Rocket", "ShieldCheck", "TrendingUp" all work even though not in ICON_PRESETS.
function getIconComponent(name?: string | null): React.ComponentType<{ size?: number }> | null {
  if (!name) return null;
  if (PRESET_ICON_MAP[name]) return PRESET_ICON_MAP[name];
  const fromLib = (LucideIcons as Record<string, unknown>)[name];
  if (fromLib && typeof fromLib === 'function') {
    return fromLib as React.ComponentType<{ size?: number }>;
  }
  return null;
}

// ── SubforumForm ──────────────────────────────────────────────────────────────
function SubforumForm({
  initial, categoryId, parentId = null, submitLabel, onSubmit, onCancel,
}: {
  initial?: Partial<SubforumInput>;
  categoryId: string;
  parentId?: string | null;
  submitLabel: string;
  onSubmit: (input: SubforumInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,           setName]       = useState(initial?.name           ?? '');
  const [description,    setDesc]       = useState(initial?.description    ?? '');
  const [leadsToThreads, setLeads]      = useState(initial?.leadsToThreads ?? true);
  const [isReadOnly,     setReadOnly]   = useState(initial?.isReadOnly     ?? false);
  const [isPrivate,      setPrivate]    = useState(initial?.isPrivate      ?? false);
  const [icon,           setIcon]       = useState(initial?.icon ?? '');
  const [iconInput,      setIconInput]  = useState(initial?.icon ?? '');
  const [submitting,     setSubmitting] = useState(false);
  const [error,          setError]      = useState<string | null>(null);

  const TypedIcon = useMemo(() => getIconComponent(iconInput.trim()), [iconInput]);
  const isTypedKnown = !!TypedIcon;
  const isTypedCustom = iconInput.trim() !== '' && !ICON_PRESETS.includes(iconInput.trim());

  const handleIconInputChange = (val: string) => {
    setIconInput(val);
    const resolved = getIconComponent(val.trim());
    if (resolved) setIcon(val.trim());
    else if (val.trim() === '') setIcon('');
  };

  const handlePresetClick = (name: string) => {
    const next = icon === name ? '' : name;
    setIcon(next);
    setIconInput(next);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), categoryId, parentId, leadsToThreads, isReadOnly, isPrivate, icon: icon || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isChild = parentId !== null;

  return (
    <div className={`rounded-lg p-3 space-y-3 border ${isChild ? 'bg-[#1a1b21] border-[#8b5cf6]/30' : 'bg-[#1e1f23] border-[#4b8ef1]/30'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isChild ? '#8b5cf6' : '#4b8ef1' }}>
        {isChild ? 'Child Subforum' : 'Subforum'}
      </p>

      {/* Name */}
      <div>
        <label className="text-[11px] text-[#8a8d91] mb-1 block">Name</label>
        <input
          value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Site News"
          className="w-full bg-[#1b1c1f] border border-[rgba(255,255,255,0.08)] rounded-md px-2.5 py-1.5 text-xs text-[#e4e6eb] placeholder:text-[#4a4b50] outline-none focus:border-[#4b8ef1] transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] text-[#8a8d91] mb-1 block">Description</label>
        <textarea
          value={description} onChange={e => setDesc(e.target.value)} placeholder="Optional description" rows={2}
          className="w-full bg-[#1b1c1f] border border-[rgba(255,255,255,0.08)] rounded-md px-2.5 py-1.5 text-xs text-[#e4e6eb] placeholder:text-[#4a4b50] outline-none focus:border-[#4b8ef1] transition-colors resize-none"
        />
      </div>

      {/* Icon */}
      <div>
        <label className="text-[11px] text-[#8a8d91] mb-1.5 block">Icon</label>

        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {ICON_PRESETS.map(name => {
            const PresetIcon = PRESET_ICON_MAP[name];
            const selected = icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => handlePresetClick(name)}
                title={name}
                className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors
                  ${selected
                    ? 'bg-[#4b8ef1]/15 border-[#4b8ef1] text-[#4b8ef1]'
                    : 'bg-[#1b1c1f] border-[rgba(255,255,255,0.08)] text-[#8a8d91] hover:border-[rgba(255,255,255,0.2)] hover:text-[#e4e6eb]'}`}
              >
                <PresetIcon size={13} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 flex items-center justify-center rounded-md border shrink-0
            ${iconInput.trim() === '' ? 'border-[rgba(255,255,255,0.08)] text-[#4a4b50]' :
              isTypedKnown ? 'border-[#4b8ef1]/40 text-[#4b8ef1] bg-[#4b8ef1]/10' :
              'border-[#ef4444]/40 text-[#ef4444] bg-[#ef4444]/10'}`}>
            {iconInput.trim() === '' ? (
              <UnknownIconFallback size={13} className="opacity-30" />
            ) : TypedIcon ? (
              <CategoryIcon name={iconInput.trim()} size={13} />
            ) : (
              <X size={13} />
            )}
          </div>
          <input
            value={iconInput}
            onChange={e => handleIconInputChange(e.target.value)}
            placeholder="Or type any lucide icon name, e.g. Rocket"
            className={`flex-1 bg-[#1b1c1f] border rounded-md px-2.5 py-1.5 text-xs text-[#e4e6eb] placeholder:text-[#4a4b50] outline-none transition-colors
              ${iconInput.trim() === '' ? 'border-[rgba(255,255,255,0.08)] focus:border-[#4b8ef1]' :
                isTypedKnown ? 'border-[#4b8ef1]/40 focus:border-[#4b8ef1]' :
                'border-[#ef4444]/40 focus:border-[#ef4444]'}`}
          />
        </div>

        <p className="text-[10px] mt-1.5" style={{ color: iconInput.trim() === '' ? '#4a4b50' : isTypedKnown ? '#4a4b50' : '#ef4444' }}>
          {iconInput.trim() === ''
            ? `No icon selected — defaults to ${leadsToThreads ? 'message' : 'layers'} icon`
            : isTypedKnown
              ? isTypedCustom ? `Using "${iconInput.trim()}" from lucide-react` : `Using preset "${iconInput.trim()}"`
              : `"${iconInput.trim()}" isn't a valid lucide-react icon name`}
        </p>
      </div>

      {/* Type */}
      <div>
        <p className="text-[11px] text-[#8a8d91] mb-1.5">When clicked, leads to...</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: true,  icon: <MessageSquare size={13} />, label: 'Threads',          sub: 'Users post threads directly' },
            { value: false, icon: <Layers size={13} />,        label: 'More subforums',   sub: 'Opens child subforums' },
          ].map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => setLeads(opt.value)}
              className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all
                ${leadsToThreads === opt.value ? 'bg-[#4b8ef1]/10 border-[#4b8ef1]/40' : 'bg-[#1b1c1f] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'}`}>
              <span className={`mt-0.5 ${leadsToThreads === opt.value ? 'text-[#4b8ef1]' : 'text-[#4a4b50]'}`}>{opt.icon}</span>
              <div>
                <p className={`text-xs font-semibold ${leadsToThreads === opt.value ? 'text-[#4b8ef1]' : 'text-[#e4e6eb]'}`}>{opt.label}</p>
                <p className="text-[10px] text-[#4a4b50]">{opt.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-4">
        {[
          { value: isReadOnly, set: setReadOnly, label: 'Read only'  },
          { value: isPrivate,  set: setPrivate,  label: 'Private'    },
        ].map(f => (
          <label key={f.label} className="flex items-center gap-1.5 cursor-pointer">
            <button type="button" onClick={() => f.set(!f.value)}
              className={`relative w-8 h-4 rounded-full transition-colors ${f.value ? 'bg-[#4b8ef1]' : 'bg-[#2d2e32]'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${f.value ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-[11px] text-[#8a8d91]">{f.label}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-[11px] text-[#ef4444]">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={!name.trim() || submitting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4b8ef1] hover:bg-[#3a7de0] disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors">
          <Check size={11} /> {submitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] disabled:opacity-40 text-[#8a8d91] text-xs font-medium rounded-md transition-colors">
          <X size={11} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── SubforumRow ───────────────────────────────────────────────────────────────
function SubforumRow({
  subforum, depth, categoryId, siblings, onRefresh,
}: {
  subforum: ApiSubforumFull;
  depth: number;
  categoryId: string;
  siblings: ApiSubforumFull[];
  onRefresh: () => void;
}) {
  const [expanded,    setExpanded]    = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const sorted = [...siblings].sort((a, b) => a.order - b.order);
  const idx    = sorted.findIndex(s => s._id === subforum._id);

  const depthColors = ['#4b8ef1', '#8b5cf6', '#10b981', '#f59e0b'];
  const accent = depthColors[Math.min(depth, depthColors.length - 1)];
  const hasChildren = subforum.children.length > 0;


  const handleUpdate = async (input: SubforumInput) => {
    try {
      await SubforumService.update(subforum._id, input);
      setEditing(false);
      onRefresh();
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to update'));
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await SubforumService.delete(subforum._id);
      onRefresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete'));
    }
  };

  const handleAddChild = async (input: SubforumInput) => {
    try {
      await SubforumService.create({ ...input, parentId: subforum._id });
      setAddingChild(false);
      onRefresh();
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to create'));
    }
  };

  const handleMove = async (direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await SubforumService.reorder(
        subforum._id,       subforum.order,
        sorted[swapIdx]._id, sorted[swapIdx].order,
      );
      onRefresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reorder'));
    }
  };

  return (
    <div>
      {/* Row */}
      <div className="group" style={{ paddingLeft: depth * 20 }}>
        {editing ? (
          <div className="mb-1">
            <SubforumForm
              initial={{ name: subforum.name, description: subforum.description, leadsToThreads: subforum.leadsToThreads, isReadOnly: subforum.isReadOnly, isPrivate: subforum.isPrivate, icon: subforum.icon }}
              categoryId={categoryId}
              parentId={subforum.parent}
              submitLabel="Save changes"
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors
            bg-[#1e1f23] border-transparent hover:border-[rgba(255,255,255,0.06)]`}>

            {/* Depth bar */}
            <div className="w-0.5 h-6 rounded-full shrink-0 opacity-60" style={{ backgroundColor: accent }} />

            {/* Expand */}
            <button type="button" onClick={() => setExpanded(v => !v)}
              className={`w-5 h-5 flex items-center justify-center text-[#4a4b50] hover:text-[#8a8d91] transition-colors ${!hasChildren && !addingChild ? 'opacity-0 pointer-events-none' : ''}`}>
              {expanded ? <ChevronDownIcon size={12} /> : <ChevronRight size={12} />}
            </button>

            {/* Icon */}
            <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent + '18', color: accent }}>
              <CategoryIcon name={subforum.icon} size={11} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-[#e4e6eb] truncate">{subforum.name}</span>
                {!subforum.leadsToThreads && (
                  <span className="text-[9px] bg-[#8b5cf6]/15 text-[#8b5cf6] px-1 py-0.5 rounded font-bold">NESTED</span>
                )}
                {subforum.isReadOnly && (
                  <span className="flex items-center gap-0.5 text-[9px] bg-[#f59e0b]/15 text-[#f59e0b] px-1 py-0.5 rounded font-bold">
                    <Lock size={8} /> READ ONLY
                  </span>
                )}
                {subforum.isPrivate && (
                  <span className="flex items-center gap-0.5 text-[9px] bg-[#ef4444]/15 text-[#ef4444] px-1 py-0.5 rounded font-bold">
                    <EyeOff size={8} /> PRIVATE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#4a4b50] truncate">
                {subforum.description || 'No description'}
                {subforum.leadsToThreads && ` · ${subforum.threadCount} threads · ${subforum.postCount} posts`}
              </p>
            </div>

            {/* Reorder */}
            <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => handleMove('up')} disabled={idx === 0}
                className="text-[#4a4b50] hover:text-[#8a8d91] disabled:opacity-20 transition-colors">
                <ChevronUp size={11} />
              </button>
              <button type="button" onClick={() => handleMove('down')} disabled={idx === siblings.length - 1}
                className="text-[#4a4b50] hover:text-[#8a8d91] disabled:opacity-20 transition-colors">
                <ChevronDown size={11} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => { setAddingChild(true); setExpanded(true); }} title="Add child subforum"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#8b5cf6]/15 text-[#4a4b50] hover:text-[#8b5cf6] transition-colors">
                <Plus size={11} />
              </button>
              <button type="button" onClick={() => setEditing(true)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#2d2e32] text-[#4a4b50] hover:text-[#e4e6eb] transition-colors">
                <Pencil size={11} />
              </button>
              <button type="button" onClick={handleDelete}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#ef4444]/10 text-[#4a4b50] hover:text-[#ef4444] transition-colors">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-[#ef4444] px-3 pb-1">{error}</p>
        )}
      </div>

      {/* Children */}
      {expanded && (
        <div>
          {subforum.children.map(child => (
            <SubforumRow
              key={child._id}
              subforum={child}
              depth={depth + 1}
              categoryId={categoryId}
              siblings={subforum.children}
              onRefresh={onRefresh}
            />
          ))}
          {addingChild && (
            <div style={{ paddingLeft: (depth + 1) * 20 + 8 }} className="mt-1 mb-1 pr-1">
              <SubforumForm
                categoryId={categoryId}
                parentId={subforum._id}
                submitLabel="Add child subforum"
                onSubmit={handleAddChild}
                onCancel={() => setAddingChild(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function AdminSubforumsPanel({ categoryId, categoryName }: Props) {
  const [subforums,    setSubforums]    = useState<ApiSubforumFull[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [actionError,  setActionError]  = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await CategoryService.get(categoryId)
      setSubforums((res.data?.subforums ?? []) as unknown as ApiSubforumFull[]);
      setLoadError(null);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Failed to load subforums'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await load();
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const handleAdd = async (input: SubforumInput) => {
    setActionError(null);
    try {
      await SubforumService.create(input);
      setShowAddForm(false);
      await load();
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to create subforum'));
    }
  };

  const topLevel = [...subforums].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">
          Subforums in <span className="text-[#e4e6eb]">{categoryName}</span>
        </p>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1 text-[10px] text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
        >
          <Plus size={11} /> Add subforum
        </button>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg">
          <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
          <p className="text-xs text-[#ef4444]">{actionError}</p>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <SubforumForm
          categoryId={categoryId}
          submitLabel="Create subforum"
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[#4a4b50] py-8 justify-center">
          <Loader2 size={14} className="animate-spin" /> Loading subforums…
        </div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg">
          <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
          <p className="text-xs text-[#ef4444]">{loadError}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !loadError && topLevel.length === 0 && !showAddForm && (
        <div className="py-8 text-center">
          <Layers size={20} className="text-[#4a4b50] mx-auto mb-2" />
          <p className="text-xs text-[#4a4b50]">No subforums yet.</p>
          <button onClick={() => setShowAddForm(true)} className="mt-2 text-[11px] text-[#4b8ef1] hover:underline">
            Add the first one →
          </button>
        </div>
      )}

      {/* Subforum tree */}
      {!loading && !loadError && topLevel.length > 0 && (
        <div className="bg-[#242528] rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden divide-y divide-[rgba(255,255,255,0.03)]">
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 bg-[#1e1f23]">
            <span className="flex items-center gap-1 text-[10px] text-[#4a4b50]">
              <MessageSquare size={9} className="text-[#4b8ef1]" /> Leads to threads
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4b50]">
              <Layers size={9} className="text-[#8b5cf6]" /> Leads to subforums
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4b50]">
              <Plus size={9} className="text-[#8b5cf6]" /> Add child (hover row)
            </span>
          </div>

          <div className="p-2 space-y-0.5">
            {topLevel.map(sub => (
              <SubforumRow
                key={sub._id}
                subforum={sub}
                depth={0}
                categoryId={categoryId}
                siblings={topLevel}
                onRefresh={load}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}