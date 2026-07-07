import { proxy, subscribe  } from "valtio";

interface t {
  canEditAnyPost:boolean;
  canEditOwnPost:boolean;
  canDeleteAnyPost:boolean;
  canDeleteOwnPost:boolean
  canDeleteOwnThread:boolean
  canPinThread:boolean
  canLockThread:boolean
  canAccessAdmin:boolean
}

interface RoleInfo {
  _id: string;
  name: string;
  color: string;
  permissions:t
}

export const store = proxy({
  // auth / hydration
  hydrated: false,
  _id: null as string | null,
  authChecked: false, // flips true once the initial /api/me check resolves — use this to avoid a logged-out flash on refresh

  // identity
  username: "",
  avatar: null as string | null,
  banner: null as string | null,
  bio: "",
  signature: "",
  customTitle: "",
  avatarEffect:null,
  usernameEffect:null,
  // role & permissions (populate role on the server, send just what the UI needs)
  role: null as RoleInfo | null,

  // stats
  postCount: 0,
  threadCount: 0,
  reputation: 0,

  // moderation
  isBanned: false,
  banReason: null as string | null,
  banExpiresAt: null as string | null, // ISO string; null = permanent or not banned

  // verification
  isVerified: false,

  // preferences
  theme: "dark-default",
  timezone: "UTC",

  // socials
  socials: {
    twitter: "",
    github: "",
    website: "",
  },

  // UI-only state (not from the server)
  bellopen: false,
});

export type ThemeId =
  | 'default'
  | 'midnight'
  | 'charcoal'
  | 'forest'
  | 'amoled'
  | 'obsidian'
  | 'blood-moon'
  | 'deep-sea'
  | 'noir'
  | 'toxic'
  | 'rust'
  | 'dusk'
  | 'ember'
  | 'void'
  | 'sepia-noir'
  | 'phantom'
  | 'infrared';


  const themeClasses = [
  'theme-midnight',
  'theme-charcoal',
  'theme-forest',
  'theme-amoled',
  'theme-obsidian',
  'theme-blood-moon',
  'theme-deep-sea',
  'theme-noir',
  'theme-toxic',
  'theme-rust',
  'theme-dusk',
  'theme-ember',
  'theme-void',
  'theme-sepia-noir',
  'theme-phantom',
  'theme-infrared',
];



const saved = typeof window !== 'undefined'
  ? (localStorage.getItem('theme') as ThemeId) ?? 'default'
  : 'default';

export const storeTheme = proxy({
  // ...your existing fields
  theme: saved as ThemeId,
});

// Apply theme class to <html> and persist
if (typeof window !== 'undefined') {
  const applyTheme = (theme: ThemeId) => {
    const el = document.documentElement;
    el.classList.remove(...themeClasses);;
    if (theme !== 'default') el.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  };

  applyTheme(storeTheme.theme);

  subscribe(storeTheme, () => applyTheme(storeTheme.theme));
}