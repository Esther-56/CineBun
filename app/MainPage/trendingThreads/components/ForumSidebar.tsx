'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StatsBar from './StatsBar';
import OnlineUsers from './OnlineUsers';
import TrendingPanel from './TrendingPanel';
import { ForumService } from '@/app/services/forum';
import { ForumStats } from '../../types/forum';
import { UsernameEffectKey } from '@/app/u/[username]/components/ui/UsernameEffect';

interface TrendingThread {
  _id: string;
  title: string;
  subforum: string;
}

interface ForumSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ForumSidebar({ isOpen = false, onClose }: ForumSidebarProps) {
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ users: { username: string; usernameEffect: UsernameEffectKey }[]; total: number }>({
    users: [],
    total: 0,
  });
  const [trendingThreads, setTrendingThreads] = useState<TrendingThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ForumService.getStats()
      .then(res => {
        const data = res?.data;
        setStats(data.stats);
        setOnlineUsers(data.onlineUsers);
        setTrendingThreads(data.trendingThreads);
      })
      .catch(err => console?.log('Failed to load forum stats', err))
      .finally(() => setLoading(false));
  }, []);

  // Lock body scroll while the mobile overlay is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const content = loading || !stats ? (
    <SidebarSkeleton />
  ) : (
    <>
      <OnlineUsers users={onlineUsers?.users} total={onlineUsers?.total} />
      <StatsBar stats={stats} />
      <TrendingPanel threads={trendingThreads} />
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-56 shrink-0 sticky top-16 self-start hidden lg:flex flex-col gap-4">
        {content}
      </aside>

      {/* Mobile full-screen overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <div className="absolute inset-0 bg-(--bg-page) flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-soft) sticky top-0 bg-(--bg-page) z-10">
              <span className="text-sm font-semibold text-(--text-primary)">Forum Info</span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-md hover:bg-(--bg-elevated) text-(--text-secondary)"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-4 p-4">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SidebarSkeleton() {
  return (
    <>
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-lg border border-(--border-soft) bg-(--bg-surface) p-4 h-28 animate-pulse" />
      ))}
    </>
  );
}