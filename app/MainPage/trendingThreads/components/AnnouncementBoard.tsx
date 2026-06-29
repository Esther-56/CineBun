'use client';
import { useEffect, useState } from 'react';
import { X, Megaphone, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnnouncementService, type Announcement } from '@/app/services/announcement';
import { RichText } from '@/app/admin/announcements/components/AnnouncementForm'; // re-use the same parser

const TYPE_STYLES: Record<Announcement['type'], { bg: string; border: string; text: string; Icon: typeof Megaphone }> = {
  info:    { bg: 'var(--bg-page)',    border: 'var(--accent)',  text: 'var(--accent)',  Icon: Megaphone },
  warning: { bg: 'var(--bg-page)',    border: '#f59e0b',        text: '#f59e0b',        Icon: AlertTriangle },
  success: { bg: 'var(--bg-page)',    border: 'var(--online)',  text: 'var(--online)',  Icon: CheckCircle2 },
  danger:  { bg: 'var(--bg-page)',    border: 'var(--danger)',  text: 'var(--danger)',  Icon: AlertCircle },
};

export default function AnnouncementBoard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    AnnouncementService.listActive()
      .then(res => setAnnouncements(res?.data?.announcements ?? []))
      .catch(() => {});

    try {
      const stored = JSON.parse(sessionStorage.getItem('dismissedAnnouncements') ?? '[]');
      setDismissed(Array.isArray(stored) ? stored : []);
    } catch {
      setDismissed([]);
    }
  }, []);

  const handleDismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(next));
    } catch {}
  };

  const visible = announcements.filter(a => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {visible.map(a => {
        const style = TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
        return (
          <div
            key={a._id}
            className="flex items-start gap-2.5 px-4 py-3 rounded-lg border"
            style={{ backgroundColor: style.bg, borderColor: style.border }}
          >
            <style.Icon size={18} className="shrink-0 mt-0.5" style={{ color: style.text }} />
            <div className="flex-1 text-sm text-(--text-secondary) leading-relaxed">
              <RichText text={a.message} />
            </div>
            <button
              onClick={() => handleDismiss(a._id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: style.text }}
              aria-label="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}