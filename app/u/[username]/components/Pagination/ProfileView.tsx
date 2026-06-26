'use client';
import { useState } from 'react';
import { ProfileHeader } from './ProfileHeader';
import { RecentThreads } from '../RecentThreads';
import { AboutTab } from './AboutTab';
import { ProfileSidebar } from './ProfileSidebar';
import { UserProfile, ProfileTab, RecentThread } from '../../types';

interface ProfileViewProps {
  profile: UserProfile;
  threads: RecentThread[];
  threadsPage: number;
  threadsTotalPages: number;
  threadsLoading?: boolean;
  total:number;
  onThreadsPageChange: (page: number) => void;
  onEdit: () => void;
}

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'posts', label: 'Recent Threads' },
  { id: 'about', label: 'About' },
];

export function ProfileView({
  profile,
  threads,
  threadsPage,
  threadsTotalPages,
  threadsLoading,
  onThreadsPageChange,
  onEdit,
  total
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  return (
    <div className="min-h-screen bg-(--bg-page)">
      <ProfileHeader profile={profile} onEdit={onEdit} total={total} />

      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-5">
          {/* Main */}
          <div className="flex-1 min-w-0 ">
            {/* Tab bar */}
            <div className="flex gap-0.5 border-b border-(--border-soft) mb-4">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-base font-semibold border-b-2 transition-colors -mb-px ${
                    activeTab === t.id
                      ? 'border-(--accent) text-(--accent)'
                      : 'border-transparent text-(--text-muted) hover:text-(--text-primary)'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'posts' && (
              <RecentThreads
                threads={threads}
                page={threadsPage}
                totalPages={threadsTotalPages}
                loading={threadsLoading}
                onPageChange={onThreadsPageChange}
              />
            )}
            {activeTab === 'about' && <AboutTab profile={profile} />}
          </div>

          {/* Sidebar */}
          <ProfileSidebar isOwnProfile={profile.isOwnProfile} username={profile.username}/>
        </div>
      </div>
    </div>
  );
}