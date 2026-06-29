'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import AdminTopBar      from '../components/AdminTopBar';
import AdminSidebar     from '../components/AdminSidebar';
import SearchBar        from '../components/SearchBar';
import FilterPills      from '../components/FilterPills';
import UserListItem     from '../components/UserListItem';
import UserDetailPanel  from '../components/UserDetailPanel';
import EmptyPlaceholder from '../components/EmptyPlaceholder';
import { UserProfile } from '@/app/u/[username]/types';
import { UserService } from '../../services/users';
import { RoleService }  from '../../services/role';
import type { Role, UserStatus } from '../lib/types';

const STATUS_FILTERS: { id: UserStatus | 'all'; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'warned',    label: 'Warned' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'banned',    label: 'Banned' },
];

export default function AdminUsersPage() {
  const router = useRouter();

  const [users,         setUsers]         = useState<UserProfile[]>([]);
  const [roles,         setRoles]         = useState<Role[]>([]);
  const [activeSection, setActiveSection] = useState('users');
  const [query,         setQuery]         = useState('');
  const [statusFilter,  setStatusFilter]  = useState<UserStatus | 'all'>('all');
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [myPriority,    setMyPriority]    = useState<number>(-1);

  const viewerCanViewIPs = myPriority > 0;

  // Load roles + my profile once
  useEffect(() => {
    RoleService.list()
      .then(({ roles }) => setRoles(roles))
      .catch(() => setError('Failed to load roles'));

    UserService.getMyProfile()
      .then((data: {data:  UserProfile }) => setMyPriority(data?.data?.role?.priority ?? -1))
      .catch(() => {});

      
  }, []);

  // Fetch users — debounced on query/filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const t = setTimeout(async () => {
      try {
        const { data } = await UserService.list({
          query:  query.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        });
        if (cancelled) return;
        const fetched = data.users;
        setUsers(fetched);
        setSelectedId(prev => {
          // keep selection if still in list, else pick first
          if (prev && fetched.find(u => u._id === prev)) return prev;
          return fetched[0]?._id ?? null;
        });
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(t); };
  }, [query, statusFilter]);

  const selected = users.find(u => u._id === selectedId) ?? null;

  const handleNav = (section: string) => {
    const routes: Record<string, string> = {
      roles: '/admin/roles',
      categories: '/admin/categories',
      badges: '/admin/badges',
      announcements: '/admin/announcements',
      media:'/admin/media-resources'
    };
    if (routes[section]) { router.push(routes[section]); return; }
    setActiveSection(section);
  };

  const handleUpdateUser = useCallback((id: string, patch: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, ...patch } : u));
  }, []);

  return (
    <div className="min-h-screen bg-[#1b1c1f]">
      <AdminTopBar crumb="Users" />

      <div className="max-w-6xl mx-auto px-4 py-5 flex gap-5">
        <AdminSidebar activeSection={activeSection} onNav={handleNav} />

        <div className="flex-1 min-w-0">
          {error && <p className="text-xs text-[#ef4444] mb-3">{error}</p>}

          {activeSection === 'users' && (
            <div className="flex gap-4">

              {/* Left column — list */}
              <div className="w-64 shrink-0 flex flex-col gap-2.5">
                <p className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest">
                  Users <span className="font-normal">({users.length})</span>
                </p>

                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search name, username, email"
                />
                <FilterPills
                  options={STATUS_FILTERS}
                  value={statusFilter}
                  onChange={v => { setStatusFilter(v); setSelectedId(null); }}
                />

                <div className="flex flex-col gap-1.5 mt-1">
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={14} className="animate-spin text-[#4a4b50]" />
                    </div>
                  )}
                  {!loading && users.length === 0 && (
                    <p className="text-[11px] text-[#4a4b50] px-1 py-3 text-center">
                      No users match your search.
                    </p>
                  )}
                  {!loading && users.map(user => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      role={roles.find(r => r._id === user.role._id)}
                      isSelected={selectedId === user._id}
                      onSelect={() => setSelectedId(user._id)}
                    />
                  ))}
                </div>
              </div>

              {/* Right column — detail */}
              {selected ? (
                <UserDetailPanel
                  user={selected}
                  roles={roles}
                  canViewIPs={viewerCanViewIPs}
                  myPriority={myPriority}
                  onUpdate={handleUpdateUser}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-[#4a4b50]">
                  {loading ? '' : 'Select a user to view details.'}
                </div>
              )}
            </div>
          )}

          {activeSection !== 'users' && <EmptyPlaceholder label={activeSection} />}
        </div>
      </div>
    </div>
  );
}