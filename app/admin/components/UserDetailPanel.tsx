'use client';
import { useState } from 'react';
import { Check, Ban, Clock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

import Field from './Field';
import StatBlock from './StatBlock';
import RoleSelect from './RoleSelect';
import RoleIcon from './RoleIcon';
import ModerationActions from './ModerationActions';
import ConfirmModal from './ConfirmModal';
import WarningsList from './WarningsList';

import { formatDate, timeAgo } from '../lib/date';
import { UserService } from '../../services/users';
import type {  Role } from '../lib/types';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { UserProfile } from '@/app/u/[username]/types';
type ModalKind = 'warn' | 'suspend' | 'ban' | null;

export default function UserDetailPanel({
  user, roles, canViewIPs, myPriority, onUpdate,
}: {
  user: UserProfile;
  roles: Role[];
  canViewIPs: boolean;
  myPriority: number;
  onUpdate: (id: string, patch: Partial<UserProfile>) => void;
}) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [showIp, setShowIp] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setloading] = useState(false)

  const role = roles.find(r => r._id === user.role._id);
  const isLocked = (role?.priority ?? Infinity) >= myPriority;

  const isSuspended = user.isBanned && !!user.banExpiresAt;
  const isBanned    = user.isBanned && !user.banExpiresAt;

  const wrap = (fn: () => Promise<void>) => async () => {
    setPending(true);
    setActionError(null);
    try { await fn(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Action failed'); }
    finally { setPending(false); }
  };

  const handleRoleChange = async (roleId: string) => {
    setloading(true)
    const prevRole = user.role;
    const newRole = roles.find(r => r._id === roleId);
    if (!newRole) return;
    onUpdate(user._id, { role: newRole });
    setActionError(null);
    try {
      const { user: updated } = await UserService.update(user._id, { role: roleId });
      onUpdate(user._id, updated);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 1500);
    } catch (err) {
      onUpdate(user._id, { role: prevRole });
      setActionError(err instanceof Error ? err.message : 'Failed to update role');
    }
    finally{
      setloading(false)
    }
  };

  const handleWarn = (reason: string) => wrap(async () => {
    setloading(true)
    const { user: updated } = await UserService.warn(user._id, reason);
    onUpdate(user._id, updated);
    setModal(null);
    setloading(false)
  })();

  const handleSuspend = (reason: string, hours?: number) => wrap(async () => {
    setloading(true)
    const { user: updated } = await UserService.suspend(user._id, reason, hours!);
    onUpdate(user._id, updated);
    setModal(null);
    setloading(false)
  })();

  const handleBan = (reason: string) => wrap(async () => {
    setloading(false)
    const { user: updated } = await UserService.ban(user._id, reason);
    onUpdate(user._id, updated);
    setModal(null);
    setloading(false)
  })();

  const handleRestore = () => wrap(async () => {
    setloading(false)
    const { user: updated } = await UserService.unban(user._id);
    onUpdate(user._id, updated);
    setloading(false)
  })();

  return (
    <div className="flex-1 min-w-0">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={user.username}  src={user.avatar}/>
        <div>
          <h2 className="text-sm font-bold text-[#e4e6eb]">{user.username}</h2>
          <p className="text-[10px] text-[#4a4b50]">@{user.username} · joined {formatDate(user.createdAt)}</p>
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
          <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
          <p className="text-xs text-[#ef4444]">{actionError}</p>
        </div>
      )}

      {/* Ban / suspend status banner */}
      {isBanned && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
          <Ban size={13} className="text-[#ef4444] shrink-0" />
          <p className="text-xs text-[#ef4444]">
            Permanently banned — {user.banReason ?? 'no reason provided'}
          </p>
        </div>
      )}
      {isSuspended && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f59e0b]/08 border border-[#f59e0b]/20 rounded-lg mb-4">
          <Clock size={13} className="text-[#f59e0b] shrink-0" />
          <p className="text-xs text-[#f59e0b]">
            Suspended until {formatDate(user.banExpiresAt!)} — {user.banReason ?? 'no reason provided'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-4">
        <StatBlock label="Posts"      value={user.postCount} />
        <StatBlock label="Threads"    value={user.threadCount} />
        <StatBlock label="Reputation" value={user.reputation} />
        <StatBlock label="Last seen"  value={timeAgo(user.lastSeenAt)} />
      </div>

      {/* Moderation actions */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest mb-2">Moderation</p>
        <ModerationActions
          isBanned={isBanned}
          isSuspended={isSuspended}
          pending={pending}
          onWarn={() => setModal('warn')}
          onSuspend={() => setModal('suspend')}
          onBan={() => setModal('ban')}
          onRestore={handleRestore}
        />
      </div>

      {/* Profile fields */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest mb-2">Profile</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username"     value={`@${user.username}`} readOnly />
          <Field label="Display name" value={user.username}       readOnly />
          <Field label="Email"        value={user.email}          readOnly />
          <Field label="Joined"       value={formatDate(user.createdAt)} readOnly />
          <div className="col-span-2">
            <Field label="Bio"       value={user.bio}       readOnly placeholder="No bio set"       multiline />
          </div>
          <div className="col-span-2">
            <Field label="Signature" value={user.signature} readOnly placeholder="No signature set" multiline />
          </div>
          {canViewIPs ? (
            <div className="relative">
              <Field label="IP address" value={showIp ? user?.ipAddress : '••••••••••'} readOnly />
              <button
                type="button"
                onClick={() => setShowIp(v => !v)}
                className="absolute right-2 top-6.5 text-[#4a4b50] hover:text-[#8a8d91] transition-colors"
              >
                {showIp ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          ) : (
            <Field label="IP address" value="Restricted — requires canViewIPs" readOnly />
          )}
        </div>
        <p className="text-[10px] text-[#4a4b50] mt-2">
          Profile fields are read-only here. Use moderation actions above or the role control below.
        </p>
      </div>

      {/* Role */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">Role</p>
          {roleSaved && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#10b981]">
              <Check size={10} /> Updated
            </span>
          )}
        </div>
        {isLocked ? (
          <p className="text-xs text-[#4a4b50]">You don&apos;t have permission to change this user&apos;s role.</p>
        ) : (
          <div className="max-w-xs">
            <RoleSelect roles={roles} value={user.role._id} onChange={handleRoleChange} />
          </div>
        )}
      </div>

      {/* Warnings */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest mb-2">Warning history</p>
        <WarningsList warnings={user.warnings} />
      </div>

      {/* Permissions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">Effective permissions</p>
          {role && (
            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: role.color }}>
              <RoleIcon name={role.name} size={10} /> via {role.name}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#4a4b50] mt-2">
          Permissions come from the assigned role. Edit the role above or visit Roles &amp; Permissions.
        </p>
      </div>

      {/* Modals */}
      {modal === 'warn' && (
        <ConfirmModal
          title="Warn user"
          description={`Issue a warning to ${user.username}. They'll see the reason on their account.`}
          confirmLabel="Issue warning"
          danger={false}
          requireReason
          onConfirm={handleWarn}
          onClose={() => setModal(null)}
          loading = {loading}
        />
      )}
      {modal === 'suspend' && (
        <ConfirmModal
          title="Suspend user"
          description={`Temporarily block ${user.username} from posting.`}
          confirmLabel="Suspend"
          requireReason
          requireHours
          onConfirm={handleSuspend}
          onClose={() => setModal(null)}
          loading = {loading}
        />
      )}
      {modal === 'ban' && (
        <ConfirmModal
          title="Ban user"
          description={`Permanently block ${user.username} from the forum. Reversible from this page.`}
          confirmLabel="Ban user"
          requireReason
          onConfirm={handleBan}
          onClose={() => setModal(null)}
          loading = {loading}
        />
      )}
    </div>
  );
}