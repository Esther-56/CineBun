'use client';
import { Edit3, MessageSquare, Ban, CheckCircle, FileText, ThumbsUp, Calendar, BellOff, Bell, ArrowLeft} from 'lucide-react';
import { StatPill } from '../ui';
import { UserProfile } from '../../types';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { formatTimeAgo } from '@/app/n/component/utils';
import { useRouter } from 'nextjs-toploader/app';
import { MessageService } from '@/app/services/messages';
import { BlockService } from '@/app/services/block';
import { useState } from 'react';
import UsernameEffect from '../ui/UsernameEffect';

interface ProfileHeaderProps {
  profile: UserProfile;
  onEdit: () => void;
  total: number;
}

export function ProfileHeader({ profile, onEdit, total }: ProfileHeaderProps) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [blocked, setBlocked] = useState(profile.isBlockedByMe ?? false);
  const [blocking, setBlocking] = useState(false);
  const [dnd, setDnd] = useState<'everyone' | 'nobody'>(profile.messagingPrivacy ?? 'everyone');
  const [togglingDnd, setTogglingDnd] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  const handleMessage = async () => {
    setMessaging(true);
    setMsgError(null);
    try {
      const res = await MessageService.send({ recipientId: profile._id, content: '👋' });
      if (!res.success) throw new Error('Could not start conversation.');
      router.push(`/messages/${res.data.conversationId}`);
    } catch (err: any) {
      setMsgError(err?? 'Could not start conversation.');
    } finally {
      setMessaging(false);
    }
  };

  const handleBlock = async () => {
    setBlocking(true);
    try {
      const action = blocked ? 'unblock' : 'block';
      const res = await BlockService.toggle(profile._id, action);
      if (!res.success) throw new Error(res.data?.message ?? 'Failed to update block status.');
      setBlocked(!blocked);
    } catch (err: any) {
      console.error('Block toggle failed:', err);
    } finally {
      setBlocking(false);
    }
  };

  const handleDnd = async () => {
    setTogglingDnd(true);
    try {
      const next = dnd === 'everyone' ? 'nobody' : 'everyone';
      const res = await BlockService.setPrivacy(next);
      if (!res.success) throw new Error(res.data?.message ?? 'Failed to update privacy.');
      setDnd(next);
    } catch (err: any) {
      console.error('DND toggle failed:', err);
    } finally {
      setTogglingDnd(false);
    }
  };

  return (
    <>
      {/* Banner */}
      <div className="h-28 sm:h-48 bg-linear-to-br from-[#1a2236] via-[#1b2640] to-(--bg-page) relative">
        <div
          className="absolute inset-0 opacity-100 bg-cover bg-center"
          style={{
            backgroundImage: profile?.banner
              ? `url(${profile.banner})`
              : 'radial-gradient(circle at 30% 50%, #4b8ef133 0%, transparent 60%), radial-gradient(circle at 70% 30%, #10b98133 0%, transparent 50%)',
          }}
        ><div className=' hidden sm:block ml-10 mt-5 cursor-pointer' onClick={()=>{
          router.push('/')
        }}>
          <ArrowLeft size={30} />
        </div>
        </div>
        
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-8 sm:-mt-10 mb-3 sm:mb-5 relative z-10">
          <div className="flex items-end gap-2 sm:gap-4">
            <div className="border-2 border-black rounded-full">
              <Avatar
                name={profile.username}
                src={profile.avatar}
                effect={profile.avatarEffect}
                size="xxl"
              />
            </div>

            {/* Identity — sm+ */}
            <div className="mb-1 hidden sm:block overflow-hidden isolate">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-(--text-primary) leading-none">
                  <UsernameEffect name={profile.username} effect={profile.usernameEffect} />
                </h1>
                {profile.isOnline ? (
                  <span className="flex items-center gap-1 bg-(--bg-surface) rounded-lg border border-(--border-soft) px-4 py-1 text-[12px] text-(--online)">
                    <div className="w-1.5 h-1.5 rounded-full bg-(--online) animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="text-[12px] bg-(--bg-surface) rounded-lg border border-(--border-soft) px-4 py-1 text-(--text-primary)">
                    {`Last seen - ${formatTimeAgo(profile.lastSeenAt)}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: profile.role.color, backgroundColor: profile.role.color + '18' }}
                >
                  {profile.role.name}
                </span>
                <span className="text-base text-(--text-secondary)">{profile.customTitle}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-end gap-1.5 mb-1">
            <div className="flex items-center gap-2">
              {profile.isOwnProfile ? (
                <>
                  {/* DND toggle — own profile only */}
                  <button
                    onClick={handleDnd}
                    disabled={togglingDnd}
                    title={dnd === 'nobody' ? 'You are not accepting messages — click to allow' : 'Allow messages from everyone'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium rounded-md transition-colors disabled:opacity-50
                      ${dnd === 'nobody'
                        ? 'border-orange-500/40 bg-(--bg-surface) text-orange-400 hover:border-orange-500/70'
                        : 'border-(--border-soft) bg-(--bg-surface) text-(--text-secondary) hover:border-(--accent)/50 hover:text-(--accent)'
                      }`}
                  >
                    {togglingDnd ? (
                      <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : dnd === 'nobody' ? (
                      <><BellOff size={12} /> DND</>
                    ) : (
                      <><Bell size={12} /> DND</>
                    )}
                  </button>

                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-(--bg-surface) border border-(--border-soft) hover:border-(--accent) text-(--text-primary) text-sm font-medium rounded-md transition-colors"
                  >
                    <Edit3 size={12} />
                    <span className="hidden xs:inline">Edit profile</span>
                    <span className="xs:hidden">Edit</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Message */}
                  <button
                    disabled={messaging}
                    onClick={handleMessage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-(--accent) hover:bg-(--accent-hover) cursor-pointer text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50"
                  >
                    {messaging ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden xs:inline">Starting…</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={13} />
                        Message
                      </>
                    )}
                  </button>

                  {/* Block */}
                  <button
                    onClick={handleBlock}
                    disabled={blocking}
                    title={blocked ? 'Unblock user' : 'Block user'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-sm font-medium rounded-md transition-colors disabled:opacity-50
                      ${blocked
                        ? 'border-green-500/30 bg-(--bg-surface) text-green-400 hover:border-green-500/60'
                        : 'border-(--border-soft) bg-(--bg-surface) text-(--text-secondary) hover:border-red-500/50 hover:text-red-400'
                      }`}
                  >
                    {blocking ? (
                      <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : blocked ? (
                      <><CheckCircle size={12} /> Unblock</>
                    ) : (
                      <><Ban size={12} /> Block</>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Inline message error */}
            {msgError && (
              <p className="text-[11px] font-semibold text-red-400 text-right max-w-55 leading-tight">
                {msgError}
              </p>
            )}
          </div>
        </div>

        {/* Identity — mobile only */}
        <div className="sm:hidden mb-3 px-1 overflow-hidden isolate">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-(--text-primary) leading-none">
              <UsernameEffect name={profile.username} effect={profile.usernameEffect} />
            </h1>
            {profile.isOnline ? (
              <span className="flex items-center gap-1 bg-(--bg-surface) rounded-lg border border-(--border-soft) px-3 py-0.5 text-[11px] text-(--online)">
                <div className="w-1.5 h-1.5 rounded-full bg-(--online) animate-pulse" />
                Online
              </span>
            ) : (
              <span className="text-[11px] bg-(--bg-surface) rounded-lg border border-(--border-soft) px-3 py-0.5 text-(--text-primary)">
                {`Last seen - ${formatTimeAgo(profile.lastSeenAt)}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{ color: profile.role.color, backgroundColor: profile.role.color + '18' }}
            >
              {profile.role.name}
            </span>
            <span className="text-sm text-(--text-secondary)">{profile.customTitle}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4 sm:flex sm:gap-3 sm:mb-5 sm:overflow-x-auto sm:pb-1">
          <StatPill icon={<FileText size={13} />} label="Posts" value={profile.postCount.toLocaleString()} />
          <StatPill icon={<MessageSquare size={13} />} label="Threads" value={total} />
          <StatPill icon={<ThumbsUp size={13} />} label="Reputation" value={profile.reputation} />
          <StatPill icon={<Calendar size={13} />} label="Joined" value={formatTimeAgo(profile.createdAt)} />
        </div>
      </div>
    </>
  );
}