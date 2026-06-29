// app/(forum)/media-resources/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { ExternalLink, Pin, Video, Image as ImageIcon, Music, Globe, Loader2 } from 'lucide-react';
import { MediaResourceService, type MediaResource, type MediaCategory } from '@/app/services/MediaResource';

const CATEGORIES: { value: MediaCategory; label: string; Icon: typeof Video; color: string; desc: string }[] = [
  { value: 'video',  label: 'Video Hosts',  Icon: Video,      color: '#4b8ef1', desc: 'Upload and share videos' },
  { value: 'image',  label: 'Image Hosts',  Icon: ImageIcon,  color: '#10b981', desc: 'Host and embed images' },
  { value: 'audio',  label: 'Audio Hosts',  Icon: Music,      color: '#a855f7', desc: 'Share music and audio clips' },
  { value: 'other',  label: 'Other Tools',  Icon: Globe,      color: '#8a8d91', desc: 'Useful external services' },
];

export default function MediaResourcesPage() {
  const [resources, setResources] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MediaCategory | 'all'>('all');

  useEffect(() => {
    MediaResourceService.listPublic()
      .then(res => setResources(res.resources ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? resources
    : resources.filter(r => r.category === activeCategory);

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: filtered.filter(r => r.category === cat.value),
  })).filter(g => g.items.length > 0);

  const counts = Object.fromEntries(
    CATEGORIES.map(c => [c.value, resources.filter(r => r.category === c.value).length])
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-1">Media Resources</h1>
        <p className="text-sm text-(--text-secondary)">
        
          {"Since we don't host media directly, here are trusted external services you can use to upload"}
          {"videos, images, and audio — then share the link here on the forum."}
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
            activeCategory === 'all'
              ? 'bg-(--accent) border-(--accent) text-white'
              : 'bg-(--bg-surface) border-(--border-muted) text-(--text-secondary) hover:border-(--border)'
          }`}
        >
          All ({resources.length})
        </button>
        {CATEGORIES.map(cat => (
          counts[cat.value] > 0 && (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === cat.value
                  ? 'text-white'
                  : 'bg-(--bg-surface) text-(--text-secondary) hover:border-(--border)'
              }`}
              style={
                activeCategory === cat.value
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : { borderColor: 'var(--border-muted)' }
              }
            >
              <cat.Icon size={10} /> {cat.label} ({counts[cat.value]})
            </button>
          )
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-(--text-muted)" />
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="text-center py-20 text-(--text-muted) text-sm">
          No media resources have been added yet.
        </div>
      )}

      {!loading && grouped.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.map(group => (
            <section key={group.value}>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${group.color}18` }}
                >
                  <group.Icon size={14} style={{ color: group.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-(--text-primary)">{group.label}</h2>
                  <p className="text-[11px] text-(--text-muted)">{group.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.items.map(r => (
                  <a
                    key={r._id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3.5 bg-(--bg-surface) hover:bg-(--bg-surface-hover) border border-(--border-muted) hover:border-(--border) rounded-xl transition-all"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${group.color}18` }}
                    >
                      <group.Icon size={15} style={{ color: group.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-(--text-primary) group-hover:text-(--accent) transition-colors">
                          {r.name}
                        </span>
                        {r.isPinned && (
                          <Pin size={10} style={{ color: group.color }} className="shrink-0" />
                        )}
                      </div>
                      {r.description && (
                        <p className="text-[12px] text-(--text-muted) mt-0.5 leading-relaxed">{r.description}</p>
                      )}
                      <p className="text-[10px] text-(--text-muted) mt-1 truncate opacity-60">{r.url}</p>
                    </div>
                    <ExternalLink
                      size={13}
                      className="shrink-0 mt-1 text-(--text-muted) group-hover:text-(--accent) transition-colors"
                    />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-[11px] text-(--text-muted) text-center mt-10">
        Know a good hosting service? Suggest it to a moderator or admin.
      </p>
    </div>
  );
}