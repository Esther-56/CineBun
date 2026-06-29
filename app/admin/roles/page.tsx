'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Save, Check, AlertTriangle, Loader2 } from 'lucide-react';

import AdminTopBar from '../components/AdminTopBar';
import AdminSidebar from '../components/AdminSidebar';
import RoleCard from '../components/RoleCard';
import RoleIcon from '../components/RoleIcon';
import NewRoleForm from '../components/NewRoleForm';
import PermissionGroup from '../components/PermissionGroup';
import EmptyPlaceholder from '../components/EmptyPlaceholder';

import { PERMISSION_GROUPS, DEFAULT_PERMISSIONS, PRESET_PERMISSIONS } from '../lib/permissions';
import { RoleService } from '../../services/role';
import type { Role, Permissions } from '../lib/types';

import { UserService } from '@/app/services/users';

export default function AdminRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  // -1 means "not loaded yet" — keeps everything locked until we know the real value,
  // rather than defaulting to 0 which could accidentally unlock things below priority 0.
  const [myPriority, setMyPriority] = useState<number>(-1);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('roles');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { roles: fetched } = await RoleService.list();
        const data = await UserService.getMyProfile() as {
          success?: boolean;
          data?: { role?: { _id?: string; name?: string; priority?: number } };
        };
        if (!data?.success) return;
        if (cancelled) return;
        setRoles(fetched);
        setSelectedId(data.data?.role?._id ?? '');
        setMyPriority(data.data?.role?.priority ?? -1);
        setLoading(false);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load roles');
      } 
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = roles.find(r => r._id === selectedId);

  // A role is locked for editing if its priority is at or above the viewer's own priority.
  // This means: you can only edit roles strictly below your own rank.
  // ">=" (rather than ">") also locks your own role from editing itself, matching the
  // old behavior where Admin could never touch the Admin row.
  const isLocked = selected ? selected.priority >= myPriority : true;

  // Whether the viewer can create/delete roles at all. Member-level users (priority 0,
  // nothing below them) should see no role-management actions, not just locked toggles.
  const canManageRoles = myPriority > 0;

  const handleNav = (section: string) => {
    if (section === 'users') {
      router.push('/admin/users');
      return;
    }
    else if (section === 'categories')
    {
      router.push('/admin/categories');
      return;
    }
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

  const handleToggle = (key: keyof Permissions, value: boolean) => {
    setRoles(prev => prev.map(r =>
      r._id === selectedId
        ? { ...r, permissions: { ...r.permissions, [key]: value } }
        : r
    ));
  };

  const handleColorChange = (color: string) => {
    setRoles(prev => prev.map(r => (r._id === selectedId ? { ...r, color } : r)));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const { role: updated } = await RoleService.update(selected._id, {
        color: selected.color,
        permissions: selected.permissions,
      });
      setRoles(prev => prev.map(r => (r._id === updated._id ? updated : r)));
      setSaved(selectedId);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async (name: string, color: string, preset: string, priority: number) => {
    const basePerms = preset === 'blank'
      ? DEFAULT_PERMISSIONS
      : { ...DEFAULT_PERMISSIONS, ...(PRESET_PERMISSIONS[preset] ?? {}) };

    setError(null);
    try {
      const { role: newRole } = await RoleService.create({
        name,
        color,
        priority: priority,
        isDefault: false,
        permissions: basePerms,
      });
      setRoles(prev => [...prev, newRole]);
      setSelectedId(newRole._id);
      setShowNewForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleDelete = async (id: string) => {
    const prevRoles = roles;
    const remaining = prevRoles.filter(r => r._id !== id);
    setRoles(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?._id ?? '');

    try {
      await RoleService.delete(id);
    } catch (err) {
      setRoles(prevRoles);
      setError(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleSetDefault = async () => {
    if (!selected) return;
    const prevRoles = roles;
    setRoles(prev => prev.map(r => ({ ...r, isDefault: r._id === selectedId })));
    try {
      await RoleService.update(selected._id, { isDefault: true });
    } catch (err) {
      setRoles(prevRoles);
      setError(err instanceof Error ? err.message : 'Failed to set default role');
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
      <AdminTopBar crumb="Roles & Permissions" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
              <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
              <p className="text-xs text-[#ef4444]">{error}</p>
            </div>
          )}

          {activeSection === 'roles' && (
            <div className="flex gap-4">
              <div className="w-52 shrink-0 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">Roles</p>
                  {canManageRoles && (
                    <button
                      onClick={() => setShowNewForm(v => !v)}
                      className="flex items-center gap-1 text-[10px] cursor-pointer text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
                    >
                      <Plus size={11} /> New
                    </button>
                  )}
                </div>

                {showNewForm && canManageRoles && (
                  <NewRoleForm onAdd={handleAddRole} onCancel={() => setShowNewForm(false)} />
                )}

                <div className="flex flex-col gap-1.5">
                  {[...roles].sort((a, b) => b.priority - a.priority).map(role => (
                    <RoleCard
                      key={role._id}
                      role={role}
                      isSelected={selectedId === role._id}
                      onSelect={() => setSelectedId(role._id)}
                      onDelete={canManageRoles && role.priority < myPriority ? () => handleDelete(role._id) : undefined}
                    />
                  ))}
                </div>
              </div>

              {selected && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selected.color + '22', color: selected.color }}>
                        <RoleIcon name={selected.name} size={15} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[#e4e6eb]">{selected.name}</h2>
                        <p className="text-[10px] text-[#4a4b50]">
                          {isLocked ? "You don't have permission to edit this role" : 'Toggle permissions below'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isLocked && (
                        <input
                          type="color"
                          value={selected.color}
                          onChange={e => handleColorChange(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                          title="Role color"
                        />
                      )}

                      {!selected.isDefault && !isLocked && (
                        <button
                          onClick={handleSetDefault}
                          className="text-[11px] text-[#8a8d91] hover:text-[#e4e6eb] px-2.5 py-1.5 bg-[#2d2e32] hover:bg-[#363739] rounded-md transition-colors"
                        >
                          Set as default
                        </button>
                      )}

                      {!isLocked && (
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-60
                            ${saved === selectedId ? 'bg-[#10b981] text-white' : 'bg-[#4b8ef1] hover:bg-[#3a7de0] text-white'}`}
                        >
                          {saving
                            ? <><Loader2 size={11} className="animate-spin" /> Saving</>
                            : saved === selectedId
                              ? <><Check size={11} /> Saved</>
                              : <><Save size={11} /> Save</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {isLocked && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-[#ef4444]/08 border border-[#ef4444]/20 rounded-lg mb-4">
                      <AlertTriangle size={13} className="text-[#ef4444] shrink-0" />
                      <p className="text-xs text-[#ef4444]">
                        You can only edit roles with a lower priority than your own.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    {PERMISSION_GROUPS.map(group => (
                      <PermissionGroup
                        key={group.label}
                        group={group}
                        permissions={selected.permissions}
                        onChange={handleToggle}
                        disabled={isLocked}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection !== 'roles' && <EmptyPlaceholder label={activeSection} />}
        </div>
      </div>
    </div>
  );
}