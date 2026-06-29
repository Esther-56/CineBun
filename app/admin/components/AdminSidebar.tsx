'use client';
import { Shield, Users, Hash, Palette, Medal,Badge, Speaker } from 'lucide-react';

const SECTIONS = [
  { id: 'roles',      label: 'Roles & Permissions', icon: <Shield size={13} /> },
  { id: 'users',      label: 'Users',               icon: <Users size={13} />  },
  { id: 'categories', label: 'Categories',          icon: <Hash size={13} />   },
  { id: 'announcements',   label: 'Announcements',  icon: <Speaker size={13} /> },
  { id: 'themes',     label: 'Themes',              icon: <Palette size={13} /> },
  { id: 'badges',     label: 'Badges',              icon: <Badge size={13} /> },
  { id: 'media-resources',   label: 'Media',        icon: <Medal size={13} /> },
];

export default function AdminSidebar({ activeSection, onNav }: {
  activeSection: string;
  onNav: (s: string) => void;
}) {
  return (
    <aside className="w-48 shrink-0">
      <div className="bg-[#242528] rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[rgba(255,255,255,0.05)]">
          <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="p-1.5 flex flex-col gap-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => onNav(s.id)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors w-full text-left
                ${activeSection === s.id
                  ? 'bg-[#4b8ef1]/15 text-[#4b8ef1]'
                  : 'text-[#8a8d91] hover:text-[#e4e6eb] hover:bg-[#2d2e32]'
                }`}
            >
              <span className={activeSection === s.id ? 'text-[#4b8ef1]' : 'text-[#4a4b50]'}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}