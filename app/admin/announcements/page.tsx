// app/admin/announcements/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Loader2, Trash2, Power } from 'lucide-react';

import AdminTopBar from '../components/AdminTopBar';
import AdminSidebar from '../components/AdminSidebar';
import AnnouncementCard from './components/AnnouncementCard';
import AnnouncementForm from './components/AnnouncementForm';
import EmptyPlaceholder from '../components/EmptyPlaceholder';

import { AnnouncementService } from '@/app/services/announcement';
import type { Announcement, AnnouncementInput } from '@/app/services/announcement';

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeSection, setActiveSection] = useState('announcements');
  const [selectedId, setSelectedId] = useState<string>('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await AnnouncementService.listAll();
        const fetched = data?.announcements ?? [];
        if (cancelled) return;
        setAnnouncements(fetched);
        setSelectedId(prev => prev || fetched[0]?._id || '');
        setLoading(false)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load announcements');
      } 
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = announcements?.find(a => a?._id === selectedId);

  const handleNav = (section: string) => {
    if (section === 'users') { router.push('/admin/users'); return; }
    if (section === 'roles') { router.push('/admin/roles'); return; }
    if (section === 'categories') { router.push('/admin/categories'); return; }
    if (section === 'badges') { router.push('/admin/badges'); return; }
    if(section === 'media-resources')
    {
      router.push('/admin/media-resources')
      return;
    }
    setActiveSection(section);
  };

  const handleCreate = async (data: AnnouncementInput) => {
    setError(null);
    try {
      const res = await AnnouncementService.create(data);
      const created = res.data.announcement;
      if (!created) return;
      setAnnouncements(prev => [created, ...prev]);
      setSelectedId(created._id);
      setShowNewForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
      throw err;
    }
  };

  const handleUpdate = async (data: AnnouncementInput) => {
    if (!selected) return;
    setError(null);
    try {
      const res = await AnnouncementService.update(selected._id, data);
      const updated = res.data.announcement ?? res.data;
      if (!updated) return;
      setAnnouncements(prev => prev.map(a => (a._id === updated._id ? updated : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement');
      throw err;
    }
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    const prev = announcements;
    setAnnouncements(curr =>
      curr.map(a => (a._id === selected._id ? { ...a, isActive: !a.isActive } : a))
    );
    try {
      await AnnouncementService.update(selected._id, { isActive: !selected.isActive });
    } catch (err) {
      setAnnouncements(prev);
      setError(err instanceof Error ? err.message : 'Failed to toggle announcement');
    }
  };

  const handleDelete = async (id: string) => {
    const prevAnnouncements = announcements;
    const remaining = prevAnnouncements.filter(a => a._id !== id);
    setAnnouncements(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?._id ?? '');
    try {
      await AnnouncementService.delete(id);
    } catch (err) {
      setAnnouncements(prevAnnouncements);
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
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
      <AdminTopBar crumb="Announcements" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
              <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
              <p className="text-xs text-[#ef4444]">{error}</p>
            </div>
          )}

          {activeSection === 'announcements' && (
            <div className="flex gap-4">
              <div className="w-60 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">
                    Announcements <span className="text-[#4a4b50] font-normal">({announcements.length})</span>
                  </p>
                  <button
                    onClick={() => { setShowNewForm(v => !v); setSelectedId(''); }}
                    className="flex items-center gap-1 text-[10px] cursor-pointer text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
                  >
                    <Plus size={11} /> New
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {announcements.length === 0 && !showNewForm && (
                    <p className="text-[11px] text-[#4a4b50] px-1 py-3 text-center">No announcements yet.</p>
                  )}
                  {announcements.map(a => (
                    <AnnouncementCard
                      key={a._id}
                      announcement={a}
                      isSelected={!showNewForm && selectedId === a._id}
                      onSelect={() => { setSelectedId(a._id); setShowNewForm(false); }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {showNewForm && (
                  <AnnouncementForm mode="create" onSubmit={handleCreate} onCancel={() => setShowNewForm(false)} />
                )}

                {!showNewForm && selected && (
                  <div className="flex flex-col gap-3">
                    <AnnouncementForm mode="edit" initial={selected} onSubmit={handleUpdate} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleActive}
                        className="flex items-center gap-1.5 text-[11px] text-[#8a8d91] hover:text-[#e4e6eb] px-2.5 py-1.5 bg-[#2d2e32] hover:bg-[#363739] rounded-md transition-colors"
                      >
                        <Power size={11} /> {selected.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(selected._id)}
                        className="flex items-center gap-1.5 text-[11px] text-[#ef4444]/80 hover:text-[#ef4444] px-2.5 py-1.5 bg-[#ef4444]/08 hover:bg-[#ef4444]/12 rounded-md transition-colors"
                      >
                        <Trash2 size={11} /> Delete announcement
                      </button>
                    </div>
                  </div>
                )}

                {!showNewForm && !selected && (
                  <div className="flex items-center justify-center h-32 text-xs text-[#4a4b50]">
                    Select an announcement to edit, or create a new one.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection !== 'announcements' && <EmptyPlaceholder label={activeSection} />}
        </div>
      </div>
    </div>
  );
}