"use client"

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Navbar from './MainPage/trendingThreads/components/Navbar';
import CategoryBlock from './MainPage/trendingThreads/components/CategoryBlock';
import ForumSidebar from './MainPage/trendingThreads/components/ForumSidebar';
import { CategoryService, ApiCategory } from './services/category-service';
import AnnouncementBoard from './MainPage/trendingThreads/components/AnnouncementBoard';
import Footer from './Footer';

function CategoryBlockSkeleton() {
  return (
    <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) overflow-hidden">
      <div className="px-4 py-3 border-b border-(--border-soft)">
        <div className="h-3.5 w-40 rounded bg-(--bg-elevated) animate-pulse" />
      </div>
      <div className="divide-y divide-(--border-soft)">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded bg-(--bg-elevated) animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="h-3 w-1/3 rounded bg-(--bg-elevated) animate-pulse" />
              <div className="h-2.5 w-2/3 rounded bg-(--bg-elevated) animate-pulse" />
            </div>
            <div className="hidden sm:block w-12 h-2.5 rounded bg-(--bg-elevated) animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForumHome() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await CategoryService.list();
        if (cancelled) return;
        setCategories(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-(--bg-page) text-(--text-primary)">
      <Navbar />

      <main className="max-w-8xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-(--text-secondary) font-semibold text-sm mt-1">Browse all categories and subforums</p>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <AnnouncementBoard />

            {loading && (
              <>{[0, 1, 2].map(i => <CategoryBlockSkeleton key={i} />)}</>
            )}

            {!loading && error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-(--danger-subtle) border border-(--danger) rounded-lg">
                <AlertTriangle size={13} className="text-(--danger) shrink-0" />
                <p className="text-base text-(--danger)">{error}</p>
              </div>
            )}

            {!loading && !error && categories.length === 0 && (
              <p className="text-base text-(--text-muted) text-center py-12">No categories yet.</p>
            )}

            {!loading && !error && categories.map(cat => (
              <CategoryBlock key={cat._id} category={cat} />
            ))}
          </div>

          <ForumSidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}