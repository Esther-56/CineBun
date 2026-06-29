'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Loader2, ChevronRight, ChevronDown } from 'lucide-react';

import AdminTopBar from '../components/AdminTopBar';
import AdminSidebar from '../components/AdminSidebar';
import CategoryRow from './components/CategoryRow';
import CategoryForm from './components/CategoryForm';
import ConfirmModal from '../components/ConfirmModal';
import EmptyPlaceholder from '../components/EmptyPlaceholder';
import AdminSubforumsPanel from './components/AdminSubforumsPanel';

import { CategoryService, type ApiCategory, type CategoryInput } from '@/app/services/category-service';
import { getErrorMessage } from './lib/apiError';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('categories');

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tracks which categories currently have their subforum tree expanded underneath them.
  // A Set (rather than a single id) lets more than one category stay open at once.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Fetches categories and applies the result via the given setters, only if `active` still
  // holds true when the request resolves. Shared by the initial load effect and the manual
  // re-sync that happens after a failed reorder.
  const runLoadCategories = async (active: { current: boolean }) => {
    try {
      const res = await CategoryService.list();
      if (!active.current) return;
      setCategories(res.data ?? []);
      setLoadError(null);
      setLoading(false)
    } catch (err) {
      if (!active.current) return;
      setLoadError(getErrorMessage(err, 'Failed to load categories'));
    }
  };

  useEffect(() => {
    const active = { current: true };
    (async () => { await runLoadCategories(active); })();
    return () => {
      active.current = false;
    };
  }, []);

  const handleNav = (section: string) => {
    if (section === 'roles') { router.push('/admin/roles'); return; }
    if (section === 'users') { router.push('/admin/users'); return; }
     else if (section === 'badges')
    {
      router.push('/admin/badges');
      return;
    }
     else if(section === 'announcements'){
      router.push('/admin/announcements');
      return;
    }
     else if(section === 'media-resources')
    {
      router.push('/admin/media-resources')
      return;
    }
    setActiveSection(section);
  };

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleCreate = async (input: CategoryInput) => {
    setActionError(null);
    try {
      const res = await CategoryService.create({ ...input, order: categories.length });
      if (res.data) setCategories(prev => [...prev, res.data as ApiCategory]);
      setShowCreateForm(false);
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to create category'));
    }
  };

  const handleUpdate = async (id: string, input: CategoryInput) => {
    setActionError(null);
    try {
      const res = await CategoryService.update(id, input);
      if (res.data) {
        const updated = res.data;
        setCategories(prev => prev.map(c => (c._id === id ? { ...c, ...updated } : c)));
      }
      setEditingId(null);
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Failed to update category'));
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await CategoryService.delete(id);
      setCategories(prev => prev.filter(c => c._id !== id));
      setDeletingId(null);
      setExpandedIds(prev => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      // Surface this inline rather than inside the (now-closing) modal, since the
      // most common failure here is "category still has subforums" — worth keeping visible.
      setActionError(getErrorMessage(err, 'Failed to delete category'));
      setDeletingId(null);
    }
  };

  // Reordering swaps `order` between two adjacent categories and persists both via PATCH.
  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const idx = sorted.findIndex(c => c._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const swapWith = sorted[swapIdx];

    setActionError(null);
    // Optimistic local update
    setCategories(prev => prev.map(c => {
      if (c._id === current._id) return { ...c, order: swapWith.order };
      if (c._id === swapWith._id) return { ...c, order: current.order };
      return c;
    }));

    try {
      await Promise.all([
        CategoryService.update(current._id, { order: swapWith.order }),
        CategoryService.update(swapWith._id, { order: current.order }),
      ]);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to reorder categories'));
      setLoading(true);
      runLoadCategories({ current: true }); // re-sync with server truth on failure
    }
  };

  const categoryPendingDelete = categories.find(c => c._id === deletingId) ?? null;

    if (loading) {
      return (
        <div className="min-h-screen bg-[#1b1c1f] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#4a4b50]" size={20} />
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-[#1b1c1f]">
      <AdminTopBar crumb="Categories" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {activeSection === 'categories' && (
            <div className="max-w-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">
                  Categories <span className="font-normal">({categories.length})</span>
                </p>
                <button
                  onClick={() => { setShowCreateForm(v => !v); setEditingId(null); }}
                  className="flex items-center gap-1 text-[10px] text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
                >
                  <Plus size={11} /> New category
                </button>
              </div>

              {actionError && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-3">
                  <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
                  <p className="text-xs text-[#ef4444]">{actionError}</p>
                </div>
              )}

              {showCreateForm && (
                <div className="mb-3">
                  <CategoryForm
                    submitLabel="Create category"
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-[#4a4b50] py-10 justify-center">
                  <Loader2 size={14} className="animate-spin" /> Loading categories…
                </div>
              )}

              {!loading && loadError && (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg">
                  <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
                  <p className="text-xs text-[#ef4444]">{loadError}</p>
                </div>
              )}

              {!loading && !loadError && sorted.length === 0 && (
                <p className="text-[11px] text-[#4a4b50] py-6 text-center">No categories yet. Create one to get started.</p>
              )}

              {!loading && !loadError && (
                <div className="flex flex-col gap-1.5">
                  {sorted.map((cat, idx) => {
                    const isExpanded = expandedIds.has(cat._id);
                    const isEditingThis = editingId === cat._id;

                    return (
                      <div key={cat._id}>
                        {isEditingThis ? (
                          <CategoryForm
                            initial={{ name: cat.name, description: cat.description, icon: cat.icon }}
                            submitLabel="Save changes"
                            onSubmit={(input) => handleUpdate(cat._id, input)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div className="flex items-stretch gap-1">
                            {/* Tree-expand toggle — reveals this category's subforums below, XenForo node-tree style */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(cat._id)}
                              title={isExpanded ? 'Hide subforums' : 'Manage subforums'}
                              className={`w-6 shrink-0 flex items-center justify-center rounded-md transition-colors
                                ${isExpanded ? 'text-[#4b8ef1] bg-[#4b8ef1]/10' : 'text-[#4a4b50] hover:text-[#8a8d91] hover:bg-[rgba(255,255,255,0.04)]'}`}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <CategoryRow
                                category={cat}
                                isEditing={false}
                                onEdit={() => { setEditingId(cat._id); setShowCreateForm(false); }}
                                onDelete={() => setDeletingId(cat._id)}
                                onMoveUp={() => handleMove(cat._id, 'up')}
                                onMoveDown={() => handleMove(cat._id, 'down')}
                                canMoveUp={idx > 0}
                                canMoveDown={idx < sorted.length - 1}
                              />
                            </div>
                          </div>
                        )}

                        {/* Nested subforum tree for this category, indented under it like a forum node tree */}
                        {isExpanded && !isEditingThis && (
                          <div className="ml-6.5 mt-1.5 mb-2 pl-3 border-l-2 border-[#2d2e32]">
                            <AdminSubforumsPanel categoryId={cat._id} categoryName={cat.name} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection !== 'categories' && <EmptyPlaceholder label={activeSection} />}
        </div>
      </div>

      {categoryPendingDelete && (
        <ConfirmModal
          title="Delete category"
          description={`Delete "${categoryPendingDelete.name}"? This can't be undone. Categories with subforums attached can't be deleted until those are moved or removed.`}
          confirmLabel="Delete category"
          onConfirm={() => handleDelete(categoryPendingDelete._id)}
          onClose={() => setDeletingId(null)}
          loading = {loading}
        />
      )}
    </div>
  );
}