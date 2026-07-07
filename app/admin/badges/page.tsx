// app/admin/badges/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Loader2, Trash2, UserPlus } from 'lucide-react';

import AdminTopBar from '../components/AdminTopBar';
import AdminSidebar from '../components/AdminSidebar';
import BadgeCard from '../components/BadgeCard';
import BadgeForm from '../components/BadgeForm';
import EmptyPlaceholder from '../components/EmptyPlaceholder';
import AssignBadgeModal from '../components/AssignBadgeModal';

import { BadgeService } from '../../services/badges';
import type { Badge } from '../../services/badges';

export default function AdminBadgesPage() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [activeSection, setActiveSection] = useState('badges');
  const [selectedId, setSelectedId] = useState<string>('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await BadgeService.list();
        const fetched = data?.badges;
        if (cancelled) return;
        setBadges(fetched);
        setSelectedId((prev) => prev || fetched[0]?._id || '');
        setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load badges');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = badges?.find((b) => b?._id === selectedId);

  const handleNav = (section: string) => {
    if (section === 'users') {
      router.push('/admin/users');
      return;
    } else if (section === 'roles') {
      router.push('/admin/roles');
      return;
    } else if (section === 'categories') {
      router.push('/admin/categories');
      return;
    } else if (section === 'announcements') {
      router.push('/admin/announcements');
      return;
    } else if (section === 'media-resources') {
      router.push('/admin/media-resources');
      return;
    }
    setActiveSection(section);
  };

  const handleCreate = async (data: Omit<Badge, '_id' | 'isDefault'>) => {
    setError(null);
    try {
      const dd = await BadgeService.create(data);
      const resp = dd.data;
      const badge = resp?.badge;
      setBadges((prev) => [badge, ...prev]);
      setSelectedId(badge?._id);
      setShowNewForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create badge');
      throw err;
    }
  };

  const handleUpdate = async (data: Omit<Badge, '_id' | 'isDefault'>) => {
    if (!selected) return;
    setError(null);
    try {
      const dd = await BadgeService.update(selected?._id, data);
      const resp = dd.data;
      const updated = resp?.badge;
      setBadges((prev) => prev.map((b) => (b?._id === updated?._id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save badge');
      throw err;
    }
  };

  const handleSetDefault = async () => {
    if (!selected) return;
    const prevBadges = badges;
    setBadges((prev) => prev.map((b) => ({ ...b, isDefault: b?._id === selectedId })));
    try {
      await BadgeService.setDefault(selected?._id);
    } catch (err) {
      setBadges(prevBadges);
      setError(err instanceof Error ? err.message : 'Failed to set default badge');
    }
  };

  const handleDelete = async (id: string) => {
    const prevBadges = badges;
    const remaining = prevBadges.filter((b) => b?._id !== id);
    setBadges(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?._id ?? '');
    try {
      await BadgeService.delete(id);
    } catch (err) {
      setBadges(prevBadges);
      setError(err instanceof Error ? err.message : 'Failed to delete badge');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b1c1f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4a4b50]" size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b1c1f]">
      <AdminTopBar crumb="Badges" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
              <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
              <p className="text-xs text-[#ef4444]">{error}</p>
            </div>
          )}

          {activeSection === 'badges' && (
            <div className="flex gap-4">
              <div className="w-60 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">
                    Badges <span className="text-[#4a4b50] font-normal">({badges.length})</span>
                  </p>
                  <button
                    onClick={() => {
                      setShowNewForm((v) => !v);
                      setSelectedId('');
                    }}
                    className="flex items-center gap-1 text-[10px] cursor-pointer text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
                  >
                    <Plus size={11} /> New
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {badges.length === 0 && !showNewForm && (
                    <p className="text-[11px] text-[#4a4b50] px-1 py-3 text-center">No badges yet.</p>
                  )}
                  {badges.map((badge) => (
                    <BadgeCard
                      key={badge?._id}
                      badge={badge}
                      isSelected={!showNewForm && selectedId === badge?._id}
                      onSelect={() => {
                        setSelectedId(badge?._id);
                        setShowNewForm(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {showNewForm && (
                  <BadgeForm mode="create" onSubmit={handleCreate} onCancel={() => setShowNewForm(false)} />
                )}

                {!showNewForm && selected && (
                  <div className="flex flex-col gap-3">
                    <BadgeForm mode="edit" initial={selected} onSubmit={handleUpdate} />

                    {selected.isAutomatic && (
                      <p className="text-[11px] text-[#4a4b50] px-1">
                        This badge is auto-awarded daily by the cron sweep whenever a user meets its trigger
                        condition. It can still be granted manually below.
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-1.5 text-[11px] text-[#4b8ef1] px-2.5 py-1.5 bg-[#4b8ef1]/08 hover:bg-[#4b8ef1]/12 rounded-md transition-colors"
                      >
                        <UserPlus size={11} /> Assign to user
                      </button>

                      {!selected.isDefault && (
                        <button
                          onClick={handleSetDefault}
                          className="text-[11px] text-[#8a8d91] hover:text-[#e4e6eb] px-2.5 py-1.5 bg-[#2d2e32] hover:bg-[#363739] rounded-md transition-colors"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selected._id)}
                        disabled={selected.isDefault}
                        title={selected.isDefault ? 'Set another badge as default before deleting this one' : undefined}
                        className="flex items-center gap-1.5 text-[11px] text-[#ef4444]/80 hover:text-[#ef4444] px-2.5 py-1.5 bg-[#ef4444]/08 hover:bg-[#ef4444]/12 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={11} /> Delete badge
                      </button>
                    </div>
                  </div>
                )}

                {!showNewForm && !selected && (
                  <div className="flex items-center justify-center h-32 text-xs text-[#4a4b50]">
                    Select a badge to edit, or create a new one.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection !== 'badges' && <EmptyPlaceholder label={activeSection} />}
        </div>
      </div>

      {showAssignModal && selected && (
        <AssignBadgeModal badge={selected} onClose={() => setShowAssignModal(false)} />
      )}
    </div>
  );
}