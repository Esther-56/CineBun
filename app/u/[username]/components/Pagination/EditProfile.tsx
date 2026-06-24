'use client';
import { useState } from 'react';
import { X, Save, Check, User, Settings, Palette, Bell, Loader2 } from 'lucide-react';
import { ProfileTab, AccountTab, AppearanceTab, NotificationsTab } from './EditTabs';
import { UserService } from '@/app/services/users';
import { UserProfile, EditTab } from '../../types';
import { UsernameEffectKey } from '../ui/UsernameEffect';
import { AvatarEffectKey } from '@/app/MainPage/trendingThreads/components/Avatar';
import { useRouter } from 'nextjs-toploader/app';


interface EditProfileProps {
  profile: UserProfile;
  onCancel: () => void;
  onSaved?: () => void;
}

export interface ProfileFormData {
  customTitle: string;
  bio: string;
  location: string;
  website: string;
  link: string;
  signature: string;
  avatar?: string;
  banner?: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const TABS: { id: EditTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',       label: 'Profile',       icon: <User size={13} />    },
  { id: 'account',       label: 'Account',       icon: <Settings size={13} /> },
  { id: 'appearance',    label: 'Appearance',    icon: <Palette size={13} />  },
  // { id: 'notifications', label: 'Notifications', icon: <Bell size={13} />     },
];

export function EditProfile({ profile, onCancel, onSaved }: EditProfileProps) {
  const router = useRouter()
  const [tab, setTab]       = useState<EditTab>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    customTitle: profile.customTitle ?? '',
    bio:         profile.bio         ?? '',
    location:    profile.location    ?? '',
    website:     profile.socials?.website ?? '',
    link:        profile.socials?.link    ?? '',
    signature:   profile.signature   ?? '',
    avatar:      profile.avatar      ?? '',
    banner:      profile.banner      ?? '',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });

  // ── Appearance state ───────────────────────────────────────────────────────
  const [themeId,          setThemeId         ] = useState(profile.theme ?? 'dark-default');
  const [usernameEffect,   setUsernameEffect  ] = useState<UsernameEffectKey>(
    (profile.usernameEffect as UsernameEffectKey) ?? null
  );
  const [avatarEffect,     setAvatarEffect    ] = useState<AvatarEffectKey>(
    (profile.avatarEffect as AvatarEffectKey) ?? null
  );

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (tab === 'profile') {
        await UserService.updateProfile({
          customTitle: formData.customTitle,
          bio:         formData.bio,
          location:    formData.location,
          signature:   formData.signature,
          socials:     { website: formData.website, link: formData.link },
          avatar:      formData.avatar,
          banner:      formData.banner,
        });
        onSaved?.();
        flashSaved();
        router.refresh();

      } else if (tab === 'account') {
        const touchedPassword =
          passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;

        if (touchedPassword) {
          if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match.');
            return;
          }
          if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
          }
          await UserService.changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword:     passwordData.newPassword,
          });
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
        flashSaved();
        router.refresh();

      } else if (tab === 'appearance') {
        await UserService.updateAppearance({
          theme:          themeId,
          usernameEffect: usernameEffect ?? null,
          avatarEffect:   avatarEffect   ?? null,
        });
        flashSaved();
        router.refresh();

      } else {
        // notifications — local-only for now
        router.refresh();
        flashSaved();
      }
    } catch {
      setError('Could not save changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-page)">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b border-(--border-soft) bg-(--bg-surface)">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-(--bg-elevated) text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X size={16} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-(--text-primary)">Edit Profile</h1>
            <p className="text-[10px] text-(--text-muted)">
              {error
                ? <span className="text-(--danger)">{error}</span>
                : 'Changes are saved per section'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 disabled:opacity-60
              ${saved ? 'bg-[#10b981] text-white' : 'bg-(--accent) hover:bg-(--accent-hover) text-white'}`}
          >
            {saving ? (
              <><Loader2 size={12} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check size={12} /> Saved</>
            ) : (
              <><Save size={12} /> Save changes</>
            )}
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 flex gap-0.5 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap -mb-px
                ${tab === t.id
                  ? 'border-(--accent) text-(--accent)'
                  : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'}`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'profile' && (
          <ProfileTab profile={profile} formData={formData} onChange={setFormData} />
        )}
        {tab === 'account' && (
          <AccountTab profile={profile} passwordData={passwordData} onPasswordChange={setPasswordData} />
        )}
        {tab === 'appearance' && (
          <AppearanceTab
            profile={profile}
            themeId={themeId}
            onThemeChange={setThemeId}
            usernameEffect={usernameEffect}
            onUsernameEffectChange={setUsernameEffect}
            avatarEffect={avatarEffect}
            onAvatarEffectChange={setAvatarEffect}
          />
        )}
        {/* {tab === 'notifications' && (
          <NotificationsTab />
        )} */}
      </div>
    </div>
  );
}