import { UsernameEffectKey } from "../components/ui/UsernameEffect";
import { AvatarEffectKey } from "@/app/MainPage/trendingThreads/components/Avatar";

export interface UserRole {
  name: string;
  color: string;
}

export interface RecentThread {
  id: string;
  subforum: string;
  threadTitle: string;
  excerpt: string;
  replyCount: number;
  views: number;
  timeAgo: string;
}



export interface Warning {
  _id: string;
  reason: string;
  issuedBy: string;
  issuedAt: string; // ISO date
}

export interface BanInfo {
  reason: string;
  bannedBy: string;
  bannedAt: string; // ISO date
  expiresAt: string | null; // null = permanent
}

export interface UserBadge {
  badge: {
    _id: string;
    name: string;
    description: string;
    icon?: string;
  };
  awardedAt: Date;
  awardedBy?: {
    _id: string;
    username: string;
  } | null;
}

export interface UserRole {
  _id: string;
  name: string;
  color: string;
  priority: number;
  isDefault: boolean;

  permissions: {
    canCreateThread: boolean;
    canReplyToThread: boolean;
    canEditOwnThread: boolean;
    canDeleteOwnThread: boolean;
    canPinThread: boolean;
    canLockThread: boolean;
    canMoveThread: boolean;

    canEditOwnPost: boolean;
    canDeleteOwnPost: boolean;
    canEditAnyPost: boolean;
    canDeleteAnyPost: boolean;

    canUploadAvatar: boolean;
    canUseSignature: boolean;
    canSendDM: boolean;

    canBanUser: boolean;
    canWarnUser: boolean;
    canViewReports: boolean;
    canManageReports: boolean;
    canViewIPs: boolean;

    canManageRoles: boolean;
    canManageCategories: boolean;
    canManageThemes: boolean;
    canAccessAdmin: boolean;
  };
}

export interface UserProfile {
  _id: string;

  username: string;
  email: string;

  avatar: string | null;
  banner: string | null;
  signature: string;
  bio: string;

  customTitle: string;

  role: UserRole;

  usernameEffect: UsernameEffectKey | null;
  avatarEffect: AvatarEffectKey | null;

  timezone: string;

  socials: {
    website: string;
    link: string;
  };

  badges: UserBadge[];

  postCount: number;
  threadCount: number;
  reputation: number;

  isVerified: boolean;
  isBanned: boolean;

  banReason: string | null;
  banExpiresAt: Date | null;

  warnings: Warning[];
  banInfo: BanInfo | null;

  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  lastSeenAt: Date;
  lastLoginAt: Date;

  isOnline: boolean;
  isOwnProfile: boolean;

  ipAddress: string;
  location:string;
  isBlockedByMe:boolean
  messagingPrivacy:'everyone' | 'nobody'
}



export interface RecentPost {
  id: string;
  threadTitle: string;
  subforum: string;
  excerpt: string;
  timeAgo: string;
  replyCount: number;
}

export interface Badge {
  icon: React.ReactNode;
  label: string;
  color: string;
}

export interface ActivityStat {
  label: string;
  value: string;
}

export type EditTab = 'profile' | 'account' | 'appearance' | 'notifications';
export type ProfileTab = 'posts' | 'about';

export interface Theme {
  id: string;
  name: string;
  bg: string;
  accent: string;
}