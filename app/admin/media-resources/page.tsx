// app/admin/media-resources/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Plus, Loader2, AlertTriangle, Trash2, Pin, PinOff,
  Video, Image as ImageIcon, Music, Globe, ExternalLink, Pencil
} from 'lucide-react';
import AdminTopBar from '../components/AdminTopBar';
import AdminSidebar from '../components/AdminSidebar';
import { MediaResourceService, type MediaResource, type MediaResourceInput, type MediaCategory } from '@/app/services/MediaResource';

const CATEGORIES: { value: MediaCategory; label: string; Icon: typeof Video }[] = [
  { value: 'video', label: 'Video Host', Icon: Video },
  { value: 'image', label: 'Image Host', Icon: ImageIcon },
  { value: 'audio', label: 'Audio Host', Icon: Music },
  { value: 'other', label: 'Other', Icon: Globe },
];

const CATEGORY_COLORS: Record<MediaCategory, string> = {
  video: '#4b8ef1',
  image: '#10b981',
  audio: '#a855f7',
  other: '#8a8d91',
};

function CategoryIcon({ category, size = 13 }: { category: MediaCategory; size?: number }) {
  const cat = CATEGORIES.find(c => c.value === category) ?? CATEGORIES[3];
  return <cat.Icon size={size} style={{ color: CATEGORY_COLORS[category] }} />;
}

interface FormState {
  name: string;
  url: string;
  description: string;
  category: MediaCategory;
  isPinned: boolean;
}

const EMPTY_FORM: FormState = { name: '', url: '', description: '', category: 'video', isPinned: false };

export default function AdminMediaResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [activeSection, setActiveSection] = useState('media-resources');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    (async () => {
      try {
        const res = await MediaResourceService.listAll();
        setResources(res.resources ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r: MediaResource) => {
    setEditingId(r._id);
    setForm({ name: r.name, url: r.url, description: r.description ?? '', category: r.category, isPinned: r.isPinned });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const input: MediaResourceInput = { ...form, description: form.description || undefined };
      if (editingId) {
        const res = await MediaResourceService.update(editingId, input);
        const updated = res.resource;
        setResources(prev => prev.map(r => r._id === updated._id ? updated : r));
      } else {
        const res = await MediaResourceService.create(input);
        
        setResources(prev => [res.resource, ...prev]);
      }
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = resources;
    setResources(r => r.filter(x => x._id !== id));
    if (editingId === id) setShowForm(false);
    try {
      await MediaResourceService.delete(id);
    } catch {
      setResources(prev);
    }
  };

  const handleTogglePin = async (r: MediaResource) => {
    setResources(prev => prev.map(x => x._id === r._id ? { ...x, isPinned: !x.isPinned } : x));
    try {
      await MediaResourceService.update(r._id, { isPinned: !r.isPinned });
    } catch {
      setResources(prev => prev.map(x => x._id === r._id ? { ...x, isPinned: r.isPinned } : x));
    }
  };

  const handleNav = (section: string) => {
    const routes: Record<string, string> = {
      users: '/admin/users', roles: '/admin/roles',
      categories: '/admin/categories', badges: '/admin/badges',
      announcements: '/admin/announcements',
    };
    if (routes[section]) { router.push(routes[section]); return; }
    setActiveSection(section);
  };

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: resources.filter(r => r.category === cat.value).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)),
  })).filter(g => g.items.length > 0 || true); // show all categories

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1b1c1f] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#4a4b50]" size={20} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b1c1f]">
      <AdminTopBar crumb="Media Resources" />
      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
              <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
              <p className="text-xs text-[#ef4444]">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">Media Resources</p>
              <p className="text-[11px] text-[#4a4b50] mt-0.5">Post external hosting links for your forum users</p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-[#4b8ef1] hover:bg-[#6ba3f5] text-white rounded-md transition-colors"
            >
              <Plus size={11} /> Add resource
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-[#25262a] border border-[#2d2e32] rounded-xl p-4 mb-4 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-[#8a8d91] uppercase tracking-widest">
                {editingId ? 'Edit Resource' : 'New Resource'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#4a4b50]">Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Catbox"
                    className="text-[12px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] focus:border-[#4b8ef1] rounded-md px-2.5 py-2 outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#4a4b50]">URL</label>
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://..."
                    className="text-[12px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] focus:border-[#4b8ef1] rounded-md px-2.5 py-2 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#4a4b50]">Description (optional)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Free image/video hosting, no account needed"
                  className="text-[12px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] focus:border-[#4b8ef1] rounded-md px-2.5 py-2 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#4a4b50]">Category</label>
                  <div className="flex gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                        className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                          form.category === cat.value
                            ? 'bg-[#4b8ef1] text-white'
                            : 'bg-[#2d2e32] text-[#8a8d91] hover:text-[#e4e6eb]'
                        }`}
                      >
                        <cat.Icon size={9} /> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer ml-auto">
                  <div
                    onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}
                    className={`w-7 h-4 rounded-full transition-colors relative ${form.isPinned ? 'bg-[#4b8ef1]' : 'bg-[#2d2e32]'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${form.isPinned ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[11px] text-[#8a8d91]">Pinned</span>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.url.trim()}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-[#4b8ef1] hover:bg-[#6ba3f5] disabled:opacity-40 text-white rounded-md transition-colors"
                >
                  {saving && <Loader2 size={10} className="animate-spin" />}
                  {editingId ? 'Save changes' : 'Add resource'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-[11px] px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] text-[#8a8d91] rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Resource list grouped by category */}
          <div className="flex flex-col gap-5">
            {grouped.map(group => (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-2">
                  <group.Icon size={12} style={{ color: CATEGORY_COLORS[group.value] }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CATEGORY_COLORS[group.value] }}>
                    {group.label}s
                  </p>
                  <span className="text-[10px] text-[#4a4b50]">({group.items.length})</span>
                </div>

                {group.items.length === 0 ? (
                  <p className="text-[11px] text-[#4a4b50] pl-1">None yet.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {group.items.map(r => (
                      <div
                        key={r._id}
                        className="flex items-center gap-3 px-3 py-2.5 bg-[#25262a] border border-[#2d2e32] rounded-lg group"
                      >
                        {r.isPinned && <Pin size={10} className="text-[#4b8ef1] shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[#e4e6eb] truncate">{r.name}</p>
                          {r.description && (
                            <p className="text-[11px] text-[#4a4b50] truncate mt-0.5">{r.description}</p>
                          )}
                        </div>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#4a4b50] hover:text-[#4b8ef1] transition-colors shrink-0"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => handleTogglePin(r)}
                          className="text-[11px] text-[#4a4b50] hover:text-[#4b8ef1] transition-colors shrink-0"
                          title={r.isPinned ? 'Unpin' : 'Pin'}
                        >
                          {r.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                        <button
                          onClick={() => openEdit(r)}
                          className="text-[#4a4b50] hover:text-[#8a8d91] transition-colors"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="text-[#4a4b50] hover:text-[#ef4444] transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {resources.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <Globe size={24} className="text-[#2d2e32]" />
              <p className="text-[12px] text-[#4a4b50]">No media resources yet.</p>
              <p className="text-[11px] text-[#4a4b50]">Add your first external hosting link above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}