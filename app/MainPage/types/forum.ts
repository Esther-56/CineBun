import { UsernameEffectKey } from "@/app/u/[username]/components/ui/UsernameEffect";
import { AvatarEffectKey } from "../trendingThreads/components/Avatar";

export interface LastPost {
  username: string;
  avatar: string;
  timeAgo: string;
  threadTitle: string;
}

export interface Subforum {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  postCount: number;
  lastPost: LastPost;
  isReadOnly?: boolean;
  isNew?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  icon: React.ReactNode;
  accentColor: string;
  subforums: Subforum[];
}

export interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalMembers: number;
  newestMember: string;
}

// ── Thread-related types (mirrors models/Thread.ts) ────────────────────────
export interface ThreadUser {
  _id?: string;
  username: string;
  avatar?: string; // single letter used by <Avatar />
  role?: 'admin' | 'moderator' | 'member';
  avatarEffect:AvatarEffectKey
  usernameEffect:UsernameEffectKey
}

export type ThreadPrefix = 'GUIDE' | 'WIP' | 'DISCUSSION' | 'QUESTION' | 'NEWS' | null;

export interface Thread {
  _id: string;
  title: string;
  subforumId: string;
  author: ThreadUser;
  isPinned: boolean;
  isLocked: boolean;
  isDeleted: boolean;
  views: number;
  replyCount: number;
  prefix: ThreadPrefix | null;
  tags: string[];
  lastPost: {
    user: ThreadUser;
    createdAt: Date; // ISO date or relative label
  } | null;
  createdAt: Date;
  subforum?: {
    _id:string;
    name:string
  }; 
  image: string;
  updatedAt:Date

}

export interface SubforumMeta {
  _id: string;
  name: string;
  description: string;
  accentColor: string;
  category:string;
  isReadOnly:boolean
}

export interface canEdit{
canEditOwnPost:boolean;
canEditAnyPost:boolean
}

// ── User & Role types (mirrors models/User.ts) ─────────────────────────────
export interface Role {
  id: string;
  name: string;        // e.g. "Administrator", "Moderator", "Member"
  color: string;        // hex used for username/badge color
  icon?: 'shield' | 'star' | null;
  permissions: canEdit
}

export interface UserSocials {
  twitter?: string;
  github?: string;
  website?: string;
}

export interface ForumUser {
  _id: string;
  username: string;
  avatar: string | null;      // url; null falls back to letter avatar
  avatarLetter: string;       // fallback letter for <Avatar />
  banner?: string | null;
  signature?: string;
  bio?: string;
  role: Role;
  customTitle?: string;
  postCount: number;
  threadCount: number;
  reputation: number;
  joinedAt: string;
  lastSeenAt: string;
  isBanned: boolean;
  isVerified: boolean;
  isOnline?: boolean;
  socials?: UserSocials;
  usernameEffect:UsernameEffectKey;
  avatarEffect:AvatarEffectKey
}

// ── Reactions (mirrors Post.reactionCount) ─────────────────────────────────
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export type ReactionCount = Record<ReactionType, number>;

// ── Post types (mirrors models/Post.ts) ────────────────────────────────────
export interface QuotedPostPreview {
  id: string;
  author: ForumUser;
  contentSnippet: string; // plain-text trimmed preview of the quoted post
}

export interface Post {
  _id: string;
  threadId: string;
  author: ForumUser;
  content: string;            // HTML from rich text editor
  isFirstPost: boolean;
  isDeleted: boolean;
  editedAt: string | null;
  editedBy?: ForumUser | null;
  editReason?: string | null;
  quotedPost?: QuotedPostPreview | null;
  attachments: string[];
  reactionCount: ReactionCount;
  createdAt: Date;
  postNumber: number; // #1, #2... display order within thread
  myReaction?:string;
  body:string;
  updatedAt:Date
}

export interface Badge {
  _id: string;
  key: string;
  label: string;
  icon: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'special';
}
export interface UserBadge {
 badge:Badge
}

export interface ForumUser {
  // ...existing fields
  badges?: UserBadge[];
}