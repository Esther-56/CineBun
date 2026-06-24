'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, MessageSquare, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { SearchService, SearchParams } from '@/app/services/search';
import { formatTimeAgo } from '@/app/n/component/utils';

// ── Types ─────────────────────────────────────────────────────
interface ThreadResult {
  _id: string;
  _resultType: 'thread';
  title: string;
  author: { _id: string; username: string; avatar?: string };
  subforum: { name: string; slug: string; _id:string };
  replyCount: number;
  views: number;
  tags: string[];
  prefix?: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
}

interface PostResult {
  _id: string;
  _resultType: 'post';
  content: string;
  author: { _id: string; username: string; avatar?: string };
  thread: { _id: string; title: string; subforum: { name: string; slug: string; _id:string } };
  createdAt: Date;
}

type SearchResult = ThreadResult | PostResult;

const SORT_OPTIONS = [
  { value: 'relevance',   label: 'Relevance' },
  { value: 'newest',      label: 'Newest' },
  { value: 'oldest',      label: 'Oldest' },
  { value: 'mostReplies', label: 'Most replies' },
  { value: 'mostViews',   label: 'Most views' },
];

const TYPE_OPTIONS = [
  { value: 'all',     label: 'All' },
  { value: 'threads', label: 'Threads' },
  { value: 'posts',   label: 'Posts' },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${safe})`, 'gi');
  return text.replace(re, '<mark class="bg-(--accent-subtle) text-(--accent) rounded-sm px-0.5">$1</mark>');
}

// ── Result Cards ─────────────────────────────────────────────
function ThreadCard({ r, q }: { r: ThreadResult; q: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/f/${r.subforum._id}/${r._id}`)}
      className="w-full text-left bg-(--bg-surface) border border-(--border-soft) cursor-pointer rounded-xl px-4 py-3.5 hover:border-(--accent)/40 transition-colors"
    >
      <div className="flex items-start gap-2.5">
        <FileText size={14} className="text-(--accent) mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {r.prefix && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-(--accent-subtle) text-(--accent)">{r.prefix}</span>
            )}
            <span
              className="text-sm font-semibold text-(--text-primary) leading-snug"
              dangerouslySetInnerHTML={{ __html: highlight(r.title, q) }}
            />
            {r.isLocked && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-(--bg-elevated) text-(--text-primary)">Locked</span>}
          </div>
          <div className="flex flex-wrap font-medium items-center gap-2 text-[14px] text-(--text-secondary)">
            <span className="flex items-center gap-1">
              <Avatar name={r.author.username} src={r.author.avatar} size="md" />
              {r.author.username}
            </span>
            <span>·</span>
            <span>{r.subforum?.name}</span>
            <span>·</span>
            <span>{formatTimeAgo(r.createdAt)}</span>
            <span>·</span>
            <span>{r.replyCount} replies</span>
            <span>·</span>
            <span>{r.views} views</span>
            {r.tags?.map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-(--bg-page) text-(--text-secondary)">#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function PostCard({ r, q }: { r: PostResult; q: string }) {
  const router = useRouter();
  const snippet = stripHtml(r.content).slice(0, 200);
  return (
    <button
      onClick={() => router.push(`/f/${r?.thread?.subforum?._id}/${r?.thread?._id}?post=${r._id}`)}
      className="w-full text-left bg-(--bg-surface) border border-(--border-soft) rounded-xl px-4 py-3.5 hover:border-(--accent)/40 transition-colors"
    >
      <div className="flex items-start gap-2.5">
        <MessageSquare size={14} className="text-(--online) mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-(--text-secondary) mb-1">
            Reply in <span className="text-(--accent)">{r.thread?.title}</span>
          </p>
          <p
            className="text-sm text-(--text-secondary) leading-relaxed line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlight(snippet, q) + (r.content.length > 200 ? '…' : '') }}
          />
          <div className="flex items-center gap-2 mt-1.5 text-[13px] text-(--text-primary)">
            <Avatar name={r.author.username} src={r.author.avatar} size="md" />
            <span>{r.author.username}</span>
            <span>·</span>
            <span>{formatTimeAgo(r.createdAt)}</span>
            {r.thread?.subforum && <><span>·</span><span>{r.thread.subforum.name}</span></>}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function SearchPageClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [query, setQuery] = useState(sp.get('q') ?? '');
  const [type, setType] = useState<SearchParams['type']>((sp.get('type') as SearchParams['type']) ?? 'all');
  const [sortBy, setSortBy] = useState<SearchParams['sortBy']>((sp.get('sortBy') as SearchParams['sortBy']) ?? 'relevance');
  const [page, setPage] = useState(parseInt(sp.get('page') ?? '1', 10));
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced
  const [author, setAuthor] = useState(sp.get('author') ?? '');
  const [tag, setTag] = useState(sp.get('tag') ?? '');
  const [prefix, setPrefix] = useState(sp.get('prefix') ?? '');
  const [dateFrom, setDateFrom] = useState(sp.get('dateFrom') ?? '');
  const [dateTo, setDateTo] = useState(sp.get('dateTo') ?? '');
  const [minReplies, setMinReplies] = useState(sp.get('minReplies') ?? '');
  const [minViews, setMinViews] = useState(sp.get('minViews') ?? '');
  const [titleOnly, setTitleOnly] = useState(sp.get('titleOnly') === 'true');

  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const buildParams = useCallback((): SearchParams => ({
    q: query || undefined,
    type,
    sortBy,
    page,
    author: author || undefined,
    tag: tag || undefined,
    prefix: prefix || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    minReplies: minReplies ? parseInt(minReplies) : undefined,
    minViews: minViews ? parseInt(minViews) : undefined,
    titleOnly: titleOnly || undefined,
  }), [query, type, sortBy, page, author, tag, prefix, dateFrom, dateTo, minReplies, minViews, titleOnly]);

  const runSearch = useCallback(async (params: SearchParams) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await SearchService.search(params);
      setResults(res.data.results ?? []);
      setTotal(res.data.total ?? 0);
      setPages(res.data.pages ?? 0);
    } catch (err) {
      console.log('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search when coming from URL params
  useEffect(() => {
    const q = sp.get('q');
    if (q) runSearch(buildParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    const params = { ...buildParams(), page: 1 };
    // Sync URL
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) urlParams.set(k, String(v)); });
    router.replace(`/search?${urlParams.toString()}`);
    runSearch(params);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    const params = { ...buildParams(), page: p };
    runSearch(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAdvanced = () => {
    setAuthor(''); setTag(''); setPrefix('');
    setDateFrom(''); setDateTo('');
    setMinReplies(''); setMinViews('');
    setTitleOnly(false);
  };

  const hasAdvanced = !!(author || tag || prefix || dateFrom || dateTo || minReplies || minViews || titleOnly);

  return (
    <div className="min-h-screen bg-(--bg-page)">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-(--bg-surface) border border-(--border-soft) rounded-xl px-3.5 focus-within:border-(--accent) transition-colors">
              <Search size={16} className="text-(--text-secondary) shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search threads and posts…"
                className="flex-1 bg-transparent py-3 text-base text-(--text-primary) placeholder:text-(--text-muted) outline-none"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
                  <X size={15} className="text-(--text-secondary) hover:text-(--text-primary)" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-1 bg-(--accent) hover:bg-(--accent-hover) text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Type tabs */}
          <div className="flex gap-0.5 bg-(--bg-surface) border border-(--border-soft) rounded-lg p-0.5">
            {TYPE_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => { setType(o.value as SearchParams['type']); setPage(1); }}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                  type === o.value ? 'bg-(--accent) text-white' : 'text-(--text-secondary) hover:text-(--text-primary)'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => { setSortBy(e.target.value as SearchParams['sortBy']); setPage(1); }}
            className="bg-(--bg-surface) border border-(--border-soft) rounded-lg px-2.5 font-semibold py-2 text-sm text-(--text-secondary) outline-none focus:border-(--accent)"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className={`flex items-center gap-1.5 px-3 rounded-lg font-semibold py-2 text-sm border transition-colors
              ${showAdvanced || hasAdvanced
                ? 'border-(--accent)/50 text-(--accent) bg-(--accent-subtle)'
                : 'border-(--border-soft) text-(--text-muted) hover:text-(--text-primary) bg-(--bg-surface)'}`}
          >
            <SlidersHorizontal size={12} />
            Advanced
            {hasAdvanced && <span className="w-1.5 h-1.5 rounded-full bg-(--accent)" />}
          </button>
        </div>

        {/* Advanced panel */}
        {showAdvanced && (
          <div className="bg-(--bg-surface) border border-(--border-soft) rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Author</span>
                <input value={author} onChange={e => setAuthor(e.target.value)}
                  placeholder="username"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Tag</span>
                <input value={tag} onChange={e => setTag(e.target.value)}
                  placeholder="e.g. guide"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Prefix</span>
                <input value={prefix} onChange={e => setPrefix(e.target.value)}
                  placeholder="e.g. [GUIDE]"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Min replies</span>
                <input value={minReplies} onChange={e => setMinReplies(e.target.value)}
                  type="number" min="0" placeholder="0"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Date from</span>
                <input value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  type="date"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Date to</span>
                <input value={dateTo} onChange={e => setDateTo(e.target.value)}
                  type="date"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) outline-none focus:border-(--accent)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] text-(--text-secondary) font-semibold uppercase tracking-wider">Min views</span>
                <input value={minViews} onChange={e => setMinViews(e.target.value)}
                  type="number" min="0" placeholder="0"
                  className="bg-(--bg-page) border border-(--border-soft) rounded-lg px-3 py-1.5 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent)" />
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setTitleOnly(v => !v)}
                  className={`w-8 h-4.5 rounded-full border transition-colors relative ${titleOnly ? 'bg-(--accent) border-(--accent)' : 'bg-(--bg-page) border-(--border-soft)'}`}
                >
                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${titleOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-semibold text-(--text-secondary)">Title only</span>
              </label>

              {hasAdvanced && (
                <button onClick={clearAdvanced} className="text-base text-(--text-secondary) hover:text-(--danger) transition-colors">
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-(--bg-surface) rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-xs text-(--text-muted) mb-3">
              {total === 0 ? 'No results found.' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}
            </p>

            {results.length === 0 && (
              <div className="bg-(--bg-surface) border border-(--border-soft) rounded-xl px-4 py-10 text-center">
                <Search size={24} className="text-(--text-muted) mx-auto mb-2" />
                <p className="text-sm text-(--text-muted)">No results matched your search.</p>
                <p className="text-xs text-(--text-muted) mt-1">Try fewer keywords or different filters.</p>
              </div>
            )}

            <div className="space-y-2">
              {results.map(r =>
                r._resultType === 'thread'
                  ? <ThreadCard key={r._id} r={r as ThreadResult} q={query} />
                  : <PostCard key={r._id} r={r as PostResult} q={query} />
              )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-(--bg-surface) border border-(--border-soft) text-(--text-muted) disabled:opacity-30 hover:border-(--accent) transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => handlePageChange(p)}
                      className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-colors
                        ${p === page
                          ? 'bg-(--accent) border-(--accent) text-white'
                          : 'bg-(--bg-surface) border-(--border-soft) text-(--text-muted) hover:border-(--accent)'}`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-(--bg-surface) border border-(--border-soft) text-(--text-muted) disabled:opacity-30 hover:border-(--accent) transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-16">
            <Search size={32} className="text-(--text-muted) mx-auto mb-3" />
            <p className="text-sm text-(--text-muted)">Search threads, posts, tags, and more.</p>
          </div>
        )}
      </div>
    </div>
  );
}