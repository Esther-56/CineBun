import Link from 'next/link';
import { Flame, Eye } from 'lucide-react';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import UsernameEffect from '@/app/u/[username]/components/ui/UsernameEffect';
import { formatTimeAgo } from '@/app/n/component/utils';
import { TrendingThreadItem } from '@/app/services/forum';

const PREFIX_COLORS: Record<string, string> = {
  Discussion: '#1877f2',
  Question:   '#e69c00',
  Guide:      '#1ca35e',
  News:       '#c43f3f',
  Poll:       '#9b5de5',
};

export default function TrendingThreadCard({ item, rank }: { item: TrendingThreadItem; rank: number }) {
  const href = item.subforum ? `/f/${item.subforum._id}/${item._id}` : `#`;
  const prefixColor = item.prefix ? (PREFIX_COLORS[item.prefix] ?? '#8a8d91') : undefined;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 border-b border-(--border-soft) last:border-b-0 hover:bg-white/3 transition-colors"
    >
      <span className="w-7 shrink-0 text-center text-[13px] font-bold text-(--accent)">
        {String(rank).padStart(2, '0')}
      </span>

      {item.author && (
        <Avatar
          name={item.author.username}
          effect={item.author.avatarEffect}
          src={item.author.avatar}
          size="sm"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {item.prefix && (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: `${prefixColor}1a`, color: prefixColor }}
            >
              {item.prefix}
            </span>
          )}
          {item.subforum && (
            <span
              className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: `${item.subforum.accentColor ?? '#4b8ef1'}1a`,
                color: item.subforum.accentColor ?? '#4b8ef1',
              }}
            >
              {item.subforum.name}
            </span>
          )}
        </div>

        <p className="text-[14px] font-semibold text-(--text-primary) line-clamp-1">
          {item.title}
        </p>

        <div className="flex items-center gap-2 mt-1 text-[11px] text-(--text-muted)">
          {item.author && (
            <span className="flex items-center gap-1">
              by <UsernameEffect name={item.author.username} effect={item.author.usernameEffect} className="font-semibold" />
            </span>
          )}
          <span>· {formatTimeAgo(item.createdAt)}</span>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-[11px] text-(--text-muted)">
        <span className="flex items-center gap-1 text-[#f59e0b] font-semibold">
          <Flame size={11} /> {item.activityCount} today
        </span>
        {typeof item.views === 'number' && (
          <span className="flex items-center gap-1">
            <Eye size={11} /> {item.views}
          </span>
        )}
      </div>
    </Link>
  );
}