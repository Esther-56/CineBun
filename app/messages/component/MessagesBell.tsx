// MessagesBell.tsx
'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { MessageService } from '@/app/services/messages';
import { Conversation } from '@/app/services/messages';

const POLL_INTERVAL = 20000;

export function MessagesBell() {
  const [open, setOpen] = useState(false);
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [previews, setPreviews] = useState<Conversation[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const pollUnread = useCallback(() => {
    MessageService.unreadCount()
      .then(res => setUnreadConversations(res?.data?.unreadConversations ?? 0))
      .catch(err => console.log('Failed to poll unread messages', err));
  }, []);

  useEffect(() => {
    pollUnread();
    const interval = setInterval(pollUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollUnread]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) {
      MessageService.listConversations()
        .then(res => setPreviews((res?.data?.conversations ?? []).slice(0, 5)))
        .catch(err => console.log('Failed to load conversations', err));
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`w-8 h-8 flex items-center cursor-pointer  text-(--text-primary) justify-center rounded transition-colors relative
          ${open ? 'bg-(--bg-elevated) text-(--text-primary)' : ' hover:bg-(--bg-elevated) hover:text-(--text-primary)'}`}
        aria-label={`Messages${unreadConversations > 0 ? ` (${unreadConversations} unread)` : ''}`}
      >
        <Mail size={18} />
        {unreadConversations > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-(--danger) text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadConversations > 9 ? '9+' : unreadConversations}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-(--bg-surface) border border-(--border-medium) rounded-lg shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div className="px-3 py-2.5 border-b border-(--border-soft)">
            <span className="text-sm font-bold text-(--text-primary)">Messages</span>
          </div>
          <div className="divide-y divide-(--border-soft) max-h-80 overflow-y-auto">
            {previews.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Mail size={20} className="text-(--text-muted) mx-auto mb-2" />
                <p className="text-sm text-(--text-muted)">No messages yet</p>
              </div>
            ) : (
              previews.map(p => (
                <Link key={p._id} href={`/messages/${p._id}`} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors
                    ${p.unread ? 'bg-(--bg-elevated) hover:bg-(--bg-elevated)' : 'hover:bg-(--bg-page)'}`}>
                  <Avatar name={p.otherUser?.username ?? '?'} src={p.otherUser?.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-medium truncate ${p.unread ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
                      {p.otherUser?.username ?? 'Unknown user'}
                    </p>
                    <p className="text-[13px] font-medium text-(--text-secondary) truncate">{p.lastMessage?.content ?? ''}</p>
                  </div>
                  {p.unread && <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shrink-0" />}
                </Link>
              ))
            )}
          </div>
          <div className="border-t border-(--border-soft)">
            <Link href="/messages" onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-2.5 text-base font-medium text-(--accent) hover:text-(--accent-hover) hover:bg-(--bg-page) transition-colors">
              View all messages
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}