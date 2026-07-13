'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame } from 'lucide-react';
import Navbar from '@/app/MainPage/trendingThreads/components/Navbar';
import Footer from '@/app/Footer';
import Pagination from '@/app/MainPage/trendingThreads/components/Pagination';
import { ScrollToTop } from '@/app/components/scroll-to-top';
import { ForumService, TrendingThreadItem } from '@/app/services/forum';
import TrendingThreadCard from './TrendingThreadCard';

function HeaderSkeleton() {
  return (
    <div className="mb-6">
      <div className="h-6 w-56 rounded bg-(--bg-elevated) sm:animate-pulse mb-2" />
      <div className="h-3 w-80 rounded bg-(--bg-elevated) sm:animate-pulse" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-(--border-soft) last:border-b-0">
      <div className="w-8 h-8 rounded-full bg-(--bg-elevated) sm:animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-3 w-2/3 rounded bg-(--bg-elevated) sm:animate-pulse" />
        <div className="h-2.5 w-1/3 rounded bg-(--bg-elevated) sm:animate-pulse" />
      </div>
      <div className="hidden sm:block w-16 h-2.5 rounded bg-(--bg-elevated) sm:animate-pulse shrink-0" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) overflow-hidden">
      {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export default function Body() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1) || 1;

  const [items, setItems]     = useState<TrendingThreadItem[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await ForumService.getTrending(page);
        if (cancelled) return;
        if (!res?.success || !res?.data) {
          setError("Couldn't load trending threads.");
          setLoading(false);
          return;
        }
        setItems(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
        setPages(res.data.pages ?? 1);
      } catch {
        if (!cancelled) setError("Couldn't load trending threads.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="min-h-screen bg-(--bg-page) text-(--text-primary)">
      <Navbar />
      <ScrollToTop />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <HeaderSkeleton />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-[#f59e0b]" />
              <h1 className="text-xl font-bold text-(--text-primary)">Trending Threads</h1>
            </div>
            <p className="text-sm text-(--text-muted) mb-5">
              {total > 0
                ? `The ${total} most active ${total === 1 ? 'thread' : 'threads'} from the last 48 hours.`
                : 'Nothing trending in the last 48 hours.'}
            </p>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[#3a1a1a] border border-[rgba(255,80,80,0.3)] text-[#ff6b6b] text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {pages > 1 && !loading && (
          <Pagination currentPage={page} totalPages={pages} basePath="/trending" />
        )}

        {loading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) px-4 py-10 text-center text-sm text-(--text-muted)">
            No trending threads right now — check back later.
          </div>
        ) : (
          <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) overflow-hidden">
            {items.map((item, i) => (
              <TrendingThreadCard
                key={item._id}
                item={item}
                rank={(page - 1) * 15 + i + 1}
              />
            ))}
          </div>
        )}

        {pages > 1 && !loading && (
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={pages} basePath="/trending" />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}