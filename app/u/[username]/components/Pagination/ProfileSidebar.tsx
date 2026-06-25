'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { sideService } from '@/app/services/sidebar';

interface Badge {
  id: string; label: string; icon: string; color: string;
}
interface ActivityStat {
  label: string; value: string;
}

interface ProfileSidebarProps {
  username: string;
  isOwnProfile: boolean;
}

export function ProfileSidebar({ username, isOwnProfile }: ProfileSidebarProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activity, setActivity] = useState<ActivityStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
   
    (async () => {
    try{
   const data = await sideService.list(username)
   
   if (cancelled) return;
   if(data.success)
   {
   setBadges(data.data.badges);
   setActivity(data.data.activity);
   }
      
    }
    catch(err){
      console.log('Failed to load sidebar:', err)
    }
    finally{
      !cancelled && setLoading(false)
    }})()
           

    return () => { cancelled = true; };
  }, [username]);

  return (
    <aside className="w-52 shrink-0 hidden lg:flex flex-col gap-3 sm:sticky sm:top-16">
      <BadgesCard badges={badges} loading={loading} />
      <ActivityCard stats={activity} loading={loading} />
      {!isOwnProfile && <ModActionsCard />}
    </aside>
  );
}

function BadgesCard({ badges, loading }: { badges: Badge[]; loading: boolean }) {
  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4">
      <h3 className="text-[13px] uppercase tracking-widest font-bold text-(--text-secondary) mb-3">Badges</h3>
      <div className="flex flex-wrap gap-2">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-(--border-soft) animate-pulse" />
            ))
          : badges?.map((badge) => {
              const Icon = (Icons as any)[badge?.icon] as Icons.LucideIcon | undefined;
              return (
                <div
                  key={badge?.id}
                  title={badge?.label}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-(--border-soft)"
                  style={{ backgroundColor: badge?.color + '18', color: badge?.color }}
                >
                  {Icon && <Icon size={12} />}
                </div>
              );
            })}
      </div>
    </div>
  );
}

function ActivityCard({ stats, loading }: { stats: ActivityStat[]; loading: boolean }) {
  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4">
      <h3 className="text-[13px] uppercase tracking-widest font-bold text-(--text-secondary) mb-3">Activity</h3>
      <div className="space-y-2.5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-(--border-soft) rounded animate-pulse" />
            ))
          : stats?.map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[13px] text-(--text-secondary)">{stat?.label}</span>
                <span className="text-[13px] font-semibold text-(--text-secondary)">{stat?.value}</span>
              </div>
            ))}
      </div>
    </div>
  );
}

function ModActionsCard() {
  const actions = ['Warn user', 'Ban user', 'View IP log'];
  return (
    <div className="bg-(--bg-surface) rounded-lg border border-(--border-soft) p-4">
      <h3 className="text-[13px] uppercase tracking-widest font-bold text-(--text-secondary) mb-3">Mod Actions</h3>
      <div className="flex flex-col gap-1.5">
        {actions.map((action, i) => (
          <button
            key={i}
            className="text-left text-base text-(--text-secondary) hover:text-(--danger) px-2 py-1.5 rounded hover:bg-(--danger-subtle) transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}