import { MessageSquare, Quote, ThumbsUp, AtSign, AlertTriangle, Mail, Sailboat } from 'lucide-react';
import { NotificationType, Notification } from './types';

// ── Type metadata ─────────────────────────────────────────────────────────────
export const TYPE_META: Record<NotificationType, {
  icon: React.ReactNode;
  color: string;
  label: string;
}> = {
  reply:    { icon: <MessageSquare size={11} />, color: '#4b8ef1', label: 'replied to your thread'    },
  quote:    { icon: <Quote size={11} />,         color: '#8b5cf6', label: 'quoted your post'           },
  reaction: { icon: <ThumbsUp size={11} />,      color: '#10b981', label: 'reacted to your post'      },
  mention:  { icon: <AtSign size={11} />,        color: '#f59e0b', label: 'mentioned you'              },
  warning:  { icon: <AlertTriangle size={11} />, color: '#ef4444', label: 'issued a warning'           },
  dm:       { icon: <Mail size={11} />,          color: '#ec4899', label: 'sent you a message'         },
  system:    {icon: <Sailboat size={11} />,      color: '#ec4899', label: 'sent you a notification'}
};

// ── Avatar colors ─────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  R: '#4b8ef1', C: '#ec4899', T: '#8b5cf6', P: '#14b8a6',
  N: '#f59e0b', A: '#ef4444', M: '#f97316', J: '#10b981',
};

export function avatarBg(letter: string): string {
  return AVATAR_COLORS[letter] ?? '#4b8ef1';
}

// ── Time formatting ───────────────────────────────────────────────────────────
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Notification summary text ─────────────────────────────────────────────────
export function notifSummary(n: Notification): string {
  const meta = TYPE_META[n.type];
  const base = `${n.actor.username} ${meta.label}`;
  if (n.thread) return `${base} in "${n.thread.title}"`;
  return base;
}

// ── Notification link ─────────────────────────────────────────────────────────
export function notifHref(n: Notification): string {
  if (n.type === 'dm')      return `/messages/${n.actor._id}`;
  if (n.type === 'warning') return `/n`;
  if (n.thread && n.post)   return `/f/${n.thread.subforum}/${n.thread._id}?post=${n.post._id}`;
  if (n.thread)             return `/f/${n.thread.subforum}//${n.thread._id}`;
  return '/n';
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date?.now() - new Date(date).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}