'use client';

import { Toggle, SectionCard } from '../ui';
import UsernameEffect, { USERNAME_EFFECTS, UsernameEffectKey } from '../ui/UsernameEffect';
import Avatar, { AVATAR_EFFECTS, AvatarEffectKey } from '@/app/MainPage/trendingThreads/components/Avatar';
import { UserProfile } from '../../types';
import { useState } from 'react';
import { Camera, Eye, EyeOff, AlertTriangle, Check, MapPin, Globe } from 'lucide-react';
import { Field } from '../ui';
import { ProfileFormData, PasswordFormData } from './EditProfile';
import { storeTheme } from '@/app/store';
import type { ThemeId } from '@/app/store';
import { useSnapshot } from 'valtio';
import { ImageUploadField } from '@/app/components/editor/ui/ImageUploadField';

interface AppearanceTabProps {
  profile: UserProfile;
  themeId: string;
  onThemeChange: (id: string) => void;
  usernameEffect: UsernameEffectKey;
  onUsernameEffectChange: (v: UsernameEffectKey) => void;
  avatarEffect: AvatarEffectKey;
  onAvatarEffectChange: (v: AvatarEffectKey) => void;
}

const THEMES: { id: ThemeId; name: string; bg: string; surface: string; accent: string }[] = [
  { id: 'default', name: 'Default', bg: '#1b1c1f', surface: '#242528', accent: '#4b8ef1' },
  { id: 'midnight', name: 'Midnight Blue', bg: '#0d1117', surface: '#161b22', accent: '#58a6ff' },
  { id: 'charcoal', name: 'Charcoal', bg: '#111111', surface: '#1a1a1a', accent: '#ff6b35' },
  { id: 'forest', name: 'Forest', bg: '#0f1a14', surface: '#162210', accent: '#4caf50' },
  { id: 'amoled', name: 'Amoled', bg: '#000000', surface: '#0a0a0a', accent: '#bb86fc' },
  { id: 'obsidian', name: 'Obsidian', bg: '#0e0c14', surface: '#16131f', accent: '#a78bfa' },
  { id: 'blood-moon', name: 'Blood Moon', bg: '#120a0a', surface: '#1c1010', accent: '#e05252' },
  { id: 'deep-sea', name: 'Deep Sea', bg: '#080f12', surface: '#0d1a20', accent: '#22d3ee' },
  { id: 'noir', name: 'Noir', bg: '#0c0c0d', surface: '#141416', accent: '#c0c0c8' },
  { id: 'toxic', name: 'Toxic', bg: '#080c08', surface: '#0e130e', accent: '#39ff14' },
  { id: 'rust', name: 'Rust', bg: '#100c08', surface: '#1a1410', accent: '#d4622a' },
  { id: 'dusk', name: 'Dusk', bg: '#110d14', surface: '#1a1420', accent: '#d879f0' },
  { id: 'ember', name: 'Ember', bg: '#100e08', surface: '#1a180e', accent: '#f59e0b' },
  { id: 'void', name: 'Void', bg: '#030305', surface: '#08080d', accent: '#00f0ff' },
  { id: 'sepia-noir', name: 'Sepia Noir', bg: '#0e0b07', surface: '#181410', accent: '#c9a85c' },
  { id: 'phantom', name: 'Phantom', bg: '#0a0c10', surface: '#121520', accent: '#6c8ef5' },
  { id: 'infrared', name: 'Infrared', bg: '#0d080f', surface: '#160d18', accent: '#f040c0' },
];

function ThemePicker() {
  const snap = useSnapshot(storeTheme);

  return (
    <SectionCard title="Forum Theme">
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => { storeTheme.theme = theme.id; }}
            className={`relative rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${
              snap.theme === theme.id
                ? 'border-(--accent)'
                : 'border-(--border-soft) hover:border-(--border-medium)'
            }`}
          >
            <div className="h-14 flex flex-col gap-1 p-2" style={{ backgroundColor: theme.bg }}>
              <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: theme.accent }} />
              <div className="h-1 rounded w-full" style={{ backgroundColor: theme.surface }} />
              <div className="h-1 rounded w-5/6" style={{ backgroundColor: theme.surface }} />
              <div className="h-1 rounded w-2/3" style={{ backgroundColor: theme.surface }} />
            </div>
            <div className="px-2 py-1.5" style={{ backgroundColor: theme.surface }}>
              <p className="text-[10px] font-medium" style={{ color: '#e4e6eb' }}>{theme.name}</p>
            </div>
            {snap.theme === theme.id && (
              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme.accent }}>
                <Check size={9} className="text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export function AppearanceTab({
  profile,
  usernameEffect,
  onUsernameEffectChange,
  avatarEffect,
  onAvatarEffectChange,
}: AppearanceTabProps) {
  return (
    <div className="space-y-4">
      <SectionCard title="Username Effect">
        <div className="p-4 space-y-3">
          <p className="text-xs text-(--text-muted)">
            Pick an animated style for your username shown on posts and threads.
          </p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-(--border-soft) border border-(--border-soft)">
            <span className="text-xs text-(--text-muted)">Preview:</span>
            <UsernameEffect name={profile?.username ?? 'YourName'} effect={usernameEffect} className="text-sm" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {USERNAME_EFFECTS.map(fx => (
              <button
                key={String(fx.id)}
                onClick={() => onUsernameEffectChange(fx.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all
                  ${usernameEffect === fx.id
                    ? 'border-(--accent) bg-(--accent-subtle)'
                    : 'border-(--border-soft) hover:border-(--border-strong) bg-(--border-soft)'
                  }`}
              >
                <UsernameEffect name={fx.label} effect={fx.id} className="text-xs pointer-events-none" />
                {usernameEffect === fx.id && <Check size={10} className="ml-auto text-(--accent) shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Avatar Ring Effect">
        <div className="p-4 space-y-3">
          <p className="text-xs text-(--text-muted)">
            Adds an animated ring or glow around your profile picture.
          </p>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-(--border-soft) border border-(--border-soft)">
            <span className="text-xs text-(--text-primary)">Preview:</span>
            <Avatar name={profile?.username} src={profile?.avatar} size="md" effect={avatarEffect} noLink />
            <span className="text-xs text-(--text-primary)">{profile?.username}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVATAR_EFFECTS?.map(fx => (
              <button
                key={String(fx.id)}
                onClick={() => onAvatarEffectChange(fx.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-all
                  ${avatarEffect === fx.id
                    ? 'border-(--accent) bg-(--accent-subtle)'
                    : 'border-(--border-soft) hover:border-(--border-strong) bg-(--border-soft)'
                  }`}
              >
                <Avatar name={profile?.username} src={profile?.avatar} size="sm" effect={fx.id} noLink />
                <span className="text-(--text-primary)">{fx.label}</span>
                {avatarEffect === fx.id && <Check size={10} className="ml-auto text-(--accent) shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <ThemePicker />
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
interface ProfileTabProps {
  profile: UserProfile;
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
}

export function ProfileTab({ profile, formData, onChange }: ProfileTabProps) {
  const set = (key: keyof ProfileFormData) => (value: string) => {
    onChange({ ...formData, [key]: value });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Avatar & Banner">
        <div className="p-4 flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-2 w-full sm:w-56">
            <div className="border-3 border-black rounded-full">
              <Avatar name={profile?.username} src={formData?.avatar || profile?.avatar} size={'xl'} />
            </div>
            <div className="w-full space-y-2">
              {/*
                ImageUploadField: "Upload" hits /api/users/me/image, which deletes the
                OLD Cloudinary avatar first, then stores the new one — onChange fires
                with the already-persisted URL. Typing a URL directly just updates local
                form state (saved when the user hits "Save changes", same as before).
              */}
              <ImageUploadField
                label="Avatar image"
                field="avatar"
                value={formData?.avatar}
                onChange={set('avatar')}
                placeholder="https://example.com/avatar.png"
                icon={<Camera size={12} />}
                hint="Paste a link, or upload directly from your device."
              />
            </div>
          </div>
          <div className="w-full space-y-2">
            <ImageUploadField
              label="Banner image"
              field="banner"
              value={formData?.banner}
              onChange={set('banner')}
              placeholder="https://example.com/banner.png"
              icon={<Camera size={12} />}
              hint="Paste a link, or upload directly from your device."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Basic Info">
        <div className="p-4 space-y-4">
          <Field label="Custom title" value={formData.customTitle} onChange={set('customTitle')} placeholder="e.g. Senior Member, Power User..." hint="Shown below your username on posts." />
          <Field label="Bio" value={formData.bio} onChange={set('bio')} placeholder="Tell the community about yourself..." multiline hint="Max 500 characters." />
        </div>
      </SectionCard>

      <SectionCard title="Social Links">
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Website" value={formData?.website} onChange={set('website')} placeholder="https://... your site" icon={<Globe size={12} />} />
          <Field label="Link" value={formData?.link} onChange={set('link')} placeholder="https://social..." icon={<MapPin size={12} />} />
        </div>
      </SectionCard>

      <SectionCard title="Signature">
        <div className="p-4">
          <Field label="Signature" value={formData.signature} onChange={set('signature')} placeholder="Shown at the bottom of your posts..." multiline hint="Keep it short. Max 200 characters." />
        </div>
      </SectionCard>
    </div>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────
interface AccountTabProps {
  profile: UserProfile;
  passwordData: PasswordFormData;
  onPasswordChange: (data: PasswordFormData) => void;
}

export function AccountTab({ profile, passwordData, onPasswordChange }: AccountTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  const set = (key: keyof PasswordFormData) => (value: string) =>
    onPasswordChange({ ...passwordData, [key]: value });

  return (
    <div className="space-y-4">
      <SectionCard title="Account Details">
        <div className="p-4 space-y-4">
          <Field label="Username" defaultValue={profile?.username} hint="Changing your username may confuse other members." disabled />
          <Field label="Email address" defaultValue={profile?.email} type="email" disabled />
        </div>
      </SectionCard>

      <SectionCard title="Change Password">
        <div className="p-4 space-y-4">
          <Field label="Current password" type={showPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={set('currentPassword')} placeholder="••••••••" />
          <Field label="New password" type={showPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={set('newPassword')} placeholder="••••••••" hint="Min 8 characters." />
          <Field label="Confirm new password" type={showPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" />
          <button
            onClick={() => setShowPassword(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPassword ? 'Hide' : 'Show'} passwords
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" danger headerExtra={<AlertTriangle size={13} className="text-(--danger)" />}>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-(--text-primary)">Delete account</p>
            <p className="text-xs text-(--text-muted) mt-0.5">Permanently deletes your account and all posts. Cannot be undone.</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-semibold text-(--danger) border border-(--danger-subtle) rounded-md hover:bg-(--danger-subtle) transition-colors shrink-0 ml-4">
            Delete account
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
export function NotificationsTab() {
  const notifications = [
    { label: 'Someone replies to your thread',  sub: 'Get notified when a member posts in a thread you started.', default: true  },
    { label: 'Someone quotes your post',         sub: 'Get notified when your post is quoted.',                   default: true  },
    { label: 'Someone reacts to your post',      sub: 'Likes, loves, and other reactions.',                       default: true  },
    { label: 'Someone mentions you',             sub: 'When your @username appears in a post.',                   default: true  },
    { label: 'You receive a direct message',     sub: 'Private messages from other members.',                     default: false },
    { label: 'Staff warnings or notices',        sub: 'Moderation actions on your account.',                      default: false },
  ];

  return (
    <SectionCard title="Notification Preferences">
      <div className="divide-y divide-(--border-soft)">
        {notifications.map((n, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm text-(--text-primary)">{n.label}</p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">{n.sub}</p>
            </div>
            <Toggle defaultChecked={n.default} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}