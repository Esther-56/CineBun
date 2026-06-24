'use client';
import { Ban, AlertTriangle } from 'lucide-react';
import RoleIcon from './RoleIcon';
import type {  Role } from '../lib/types';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { UserProfile } from '@/app/u/[username]/types';
const STATUS_STYLES: Record<UserProfile['customTitle'], string> = {
  active:    'bg-[#10b981]/15 text-[#10b981]',
  warned:    'bg-[#f59e0b]/15 text-[#f59e0b]',
  suspended: 'bg-[#f59e0b]/15 text-[#f59e0b]',
  banned:    'bg-[#ef4444]/15 text-[#ef4444]',
};

export default function UserListItem({
  user, role, isSelected, onSelect,
}: {
  user: UserProfile; role: Role | undefined; isSelected: boolean; onSelect: () => void;
}) {

  console.log(user)
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border
        ${isSelected
          ? 'bg-[#1e2535] border-[#4b8ef1]/40'
          : 'bg-[#1e1f23] border-transparent hover:bg-[#242528] hover:border-[rgba(255,255,255,0.06)]'
        }`}
    >
      {/* Avatar */}
      <Avatar name={user.username} src={user.avatar}/>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#e4e6eb] truncate">{user.username}</span>
          {user.isBanned  && <Ban size={10} className="text-[#ef4444] shrink-0" />}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-[#4a4b50] truncate">@{user.username}</span>
          {role && (
            <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: role.color }}>
              <RoleIcon name={role.name} size={9} />
            </span>
          )}
        </div>
      </div>

      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 capitalize ${STATUS_STYLES[user.customTitle]}`}>
        {user.customTitle}
      </span>
    </div>
  );
}