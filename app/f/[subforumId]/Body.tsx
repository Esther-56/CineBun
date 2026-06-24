'use client';

import { notFound, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../MainPage/trendingThreads/components/Navbar';
import SubforumHeader from '../../MainPage/trendingThreads/threadcomponent/SubforumHeader';
import ThreadList from '../../MainPage/trendingThreads/threadcomponent/ThreadList';
import SubforumGrid from '../../MainPage/trendingThreads/components/SubforumGrid';
import ForumSidebar from '../../MainPage/trendingThreads/components/ForumSidebar';
import Pagination from '../../MainPage/trendingThreads/components/Pagination';
import { Thread } from '@/app/MainPage/types/forum';
import { ApiSubforumFull } from '@/app/services/subforum-service';
import { SubforumService } from '@/app/services/subforum-service';
import AnnouncementBoard from '@/app/MainPage/trendingThreads/components/AnnouncementBoard';
import Footer from '@/app/Footer';

interface SubforumPageProps {
  params_cc: { subforumId: string };
}

function SubforumHeaderSkeleton() {
  return (
    <div className="mb-5">
      <div className="h-5 w-48 rounded bg-(--bg-elevated) animate-pulse mb-2" />
      <div className="h-3 w-72 rounded bg-(--bg-elevated) animate-pulse" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-(--border-soft) last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-(--bg-elevated) animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-3 w-1/2 rounded bg-(--bg-elevated) animate-pulse" />
        <div className="h-2.5 w-1/3 rounded bg-(--bg-elevated) animate-pulse" />
      </div>
      <div className="hidden sm:block w-14 h-2.5 rounded bg-(--bg-elevated) animate-pulse shrink-0" />
    </div>
  );
}

function SubforumBodySkeleton() {
  return (
    <div className="rounded-lg border border-(--border-soft) bg-(--bg-surface) overflow-hidden">
      {[0, 1, 2, 3, 4].map(i => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

export default function Body({ params_cc }: SubforumPageProps) {
  const subforumId = params_cc?.subforumId;
  const searchParams = useSearchParams();
  const page = searchParams.get('page') ?? 1;

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    if (!subforumId) { setNotFoundFlag(true); return; }
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const data = await SubforumService.get(subforumId, Number(page));
      if (cancelled) return;
      if (!data?.data) { setNotFoundFlag(true); setLoading(false); return; }
      setResult(data.data);
      setLoading(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [subforumId, page]);

  if (notFoundFlag) { notFound(); return null; }

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-(--bg-page) text-(--text-primary)">
        <Navbar />
        <main className="max-w-8xl mx-auto px-4 py-6">
          <SubforumHeaderSkeleton />
          <div className="flex gap-5">
            <div className="flex-1 min-w-0"><SubforumBodySkeleton /></div>
            <ForumSidebar />
          </div>
        </main>
      </div>
    );
  }

  const { type, pages } = result;
  const subforum = result.subforum || {};
  const items = result.items || [];
  const length = items.length === 0;
  const threadItems = type === 'threads' ? (items as unknown as Thread[]) : [];
  const subforumItems = type === 'threads' ? [] : (items as ApiSubforumFull[]);

  return (
    <div className="min-h-screen bg-(--bg-page) text-(--text-primary)">
      <Navbar />
      <main className="max-w-8xl mx-auto px-4 py-6">
        <SubforumHeader subforum={subforum} type={type} length={length} />
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <AnnouncementBoard />
            {(pages ?? 0) > 1 && (
              <Pagination currentPage={Number(page) ?? 1} totalPages={pages!} basePath={`/f/${subforumId}`} />
            )}
            {type === 'threads' ? (
              <ThreadList threads={threadItems} subforumId={subforumId} accentColor={subforum.accentColor} />
            ) : (
              <SubforumGrid subforums={subforumItems} accentColor={subforum.accentColor} />
            )}
            {(pages ?? 0) > 1 && (
              <Pagination currentPage={Number(page) ?? 1} totalPages={pages!} basePath={`/f/${subforumId}`} />
            )}
          </div>
          <ForumSidebar />
        </div>
      </main>
      <Footer/>
    </div>
  );
}