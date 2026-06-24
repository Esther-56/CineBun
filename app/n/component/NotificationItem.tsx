import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { Megaphone } from 'lucide-react';
import { Notification } from './types';
import { TYPE_META, timeAgo, notifHref } from './utils';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({ notification: n, onRead, compact = false }: NotificationItemProps) {
  const meta = TYPE_META[n.type];
  const href = notifHref(n);
  

  const handleClick = () => {
    if (!n.read) onRead(n._id);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`flex items-start gap-3 transition-colors relative group
        ${compact ? 'px-3 py-2.5' : 'px-5 py-4'}
        ${n.read ? 'hover:bg-(--bg-surface)' : 'bg-(--accent-subtle) hover:bg-(--accent)/20'}`}
    >
      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-(--accent) rounded-r" />}

      <div className="relative shrink-0">
        {n.actor ? (
          <Avatar name={n.actor.username} src={n.actor.avatar} size={compact ? 'sm' : 'md'} />
        ) : (
          // System / no-actor notifications (welcome, account-level warnings)
          <div className={`rounded-full flex items-center justify-center bg-(--accent) text-white shrink-0 ${compact ? 'w-7 h-7' : 'w-9 h-9'}`}>
            <Megaphone size={compact ? 12 : 14} />
          </div>
        )}
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-(--bg-page)"
          style={{ backgroundColor: meta.color }}
        >
          <span style={{ color: '#fff' }}>{meta.icon}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`leading-snug ${compact ? 'text-sm' : 'text-base'} ${n.read ? 'text-(--text-muted)' : 'text-(--text-primary)'}`}>
          {n.actor && <span className="font-semibold text-(--text-primary)">{n.actor.username}</span>}
          {' '}
          <span style={{ color: meta.color }}>{n?.message ?? meta.label}</span>
          {n.thread && (
            <span className="text-(--text-muted)"> in <span className={`${n.read ? 'text-(--text-secondary)' : 'text-(--text-secondary)'} line-clamp-1`}>&quot;{n.thread.title}&quot;</span></span>
          )}
        </p>
        <p className={`mt-0.5 ${compact ? 'text-[12px]' : 'text-[13px]'} text-(--text-secondary)`}>
          {timeAgo(n.createdAt)}
        </p>
      </div>
        
      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shrink-0 mt-1.5" />}
    </a>
  );
}