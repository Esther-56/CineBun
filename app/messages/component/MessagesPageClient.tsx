// app/messages/component/MessagesPageClient.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { Mail, Send, Trash2, ArrowLeft } from 'lucide-react';
import Avatar from '@/app/MainPage/trendingThreads/components/Avatar';
import { MessageService } from '@/app/services/messages';
import { MessageUser } from '../types';
import { Conversation } from '@/app/services/messages';
import { useSnapshot } from 'valtio';
import { store } from '@/app/store';

export default function MessagesPageClient({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const snap = useSnapshot(store);
  const myId = snap._id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [active, setActive] = useState<Conversation | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!activeId); // mobile: show sidebar when no active chat
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    MessageService.listConversations()
      .then(res => setConversations(res.data.conversations ?? []))
      .catch(err => console.log('Failed to load conversations', err))
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!activeId) { setActive(null); setShowSidebar(true); return; }
    setShowSidebar(false); // on mobile, opening a chat hides sidebar
    setLoadingThread(true);
    MessageService.getConversation(activeId)
      .then(res => {
        setActive(res?.data?.conversation);
        setConversations(prev => prev.map(c => c._id === activeId ? { ...c, unread: false } : c));
      })
      .catch(err => console.log('Failed to load conversation', err))
      .finally(() => setLoadingThread(false));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages?.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeId) return;
    setSending(true);
    setDraft('');
    try {
      const res = await MessageService.send({ conversationId: activeId, content });
      setActive(prev => prev ? { ...prev, messages: [...prev.messages, res.data.message] } : prev);
      if (!myId) return;
      setConversations(prev =>
        prev.map(c => c._id === activeId
          ? { ...c, lastMessage: { content, sender: myId, createdAt: new Date().toISOString() }, lastMessageAt: new Date().toISOString() }
          : c
        ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      );
    } catch (err) {
      console.log('Failed to send message', err);
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await MessageService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeId === id) router.push('/messages');
    } catch (err) { console.log('Failed to delete conversation', err); }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeId) return;
    setActive(prev => prev ? { ...prev, messages: prev.messages.filter(m => m._id !== messageId) } : prev);
    try { await MessageService.deleteMessage(activeId, messageId); }
    catch (err) { console.log('Failed to delete message', err); }
  };

  const activeOther: MessageUser | undefined = active?.participants.find(p => p._id !== myId);

  return (
    <div className="min-h-screen bg-(--bg-page)">

      {/* ── Top bar ── */}
      <div className="max-w-5xl mx-auto pt-4 px-3 sm:px-4 flex items-center gap-3">
        {/* Mobile: back arrow goes to sidebar when in a chat, else history back */}
        <button
          onClick={() => {
            if (activeId && !showSidebar) { setShowSidebar(true); router.push('/messages'); }
            else router.push('/');
          }}
          className="text-(--text-primary) ml-5 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Mobile header title */}
        <span className="sm:hidden text-sm font-semibold text-(--text-primary)">
          {activeId && activeOther ? activeOther.username : 'Messages'}
        </span>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex gap-0 sm:gap-5">

        {/* ── Sidebar ── */}
        {/* Mobile: full-width when showSidebar, hidden when in a chat */}
        {/* Desktop: always visible fixed width */}
        <aside className={`
          ${showSidebar ? 'flex' : 'hidden'} sm:flex
          w-full sm:w-64 shrink-0 flex-col
        `}>
          <div className="bg-(--bg-surface) border border-(--border-soft) rounded-xl overflow-hidden w-full">
            <div className="px-3.5 py-3 border-b border-(--border-soft) flex items-center gap-2">
              <Mail size={18} className="text-(--accent)" />
              <span className="text-base font-bold text-(--text-primary)">Messages</span>
            </div>
            <div className="max-h-[75vh] sm:max-h-[70vh] overflow-y-auto divide-y divide-(--border-soft)">
              {loadingList ? (
                <div className="p-4 text-center text-[13px] text-(--text-secondary)">Loading…</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center font-medium text-[14px] text-(--text-secondary)">No conversations yet.</div>
              ) : (
                conversations.map(c => (
                  <button
                    key={c._id}
                    onClick={() => router.push(`/messages/${c._id}`)}
                    className={`w-full flex cursor-pointer items-center gap-2.5 px-3 py-3 sm:py-2.5 text-left transition-colors
                      ${c._id === activeId ? 'bg-(--accent)/10' : c.unread ? 'bg-(--accent-subtle) hover:bg-(--accent)/20' : 'hover:bg-(--bg-page)'}`}
                  >
                    <Avatar name={c.otherUser?.username ?? '?'} src={c.otherUser?.avatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-medium truncate ${c.unread ? 'text-(--text-primary)' : 'text-(--text-secondary)'}`}>
                        {c.otherUser?.username ?? 'Unknown user'}
                      </p>
                      <p className="text-[13px] sm:text-[15px] font-medium text-(--text-secondary) truncate">{c.lastMessage?.content ?? ''}</p>
                    </div>
                    {c.unread && <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* ── Chat panel ── */}
        {/* Mobile: full-width when a chat is active, hidden when showing sidebar */}
        <div className={`
          ${!showSidebar ? 'flex' : 'hidden'} sm:flex
          flex-1 min-w-0 bg-(--bg-surface) border border-(--border-soft) rounded-xl flex-col
        `} style={{ height: '75vh' }}>

          {!activeId || !active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <Mail size={28} className="text-(--text-secondary) mb-3" />
              <p className="text-base font-semibold text-(--text-muted)">
                {loadingThread ? 'Loading…' : 'Select a conversation'}
              </p>
              <p className="text-sm text-(--text-secondary) mt-1">Pick someone from the list to see your messages.</p>
            </div>
          ) : (
            <>
              {/* Chat header — desktop only (mobile uses top bar) */}
              <div className="hidden sm:flex px-4 py-3 border-b border-(--border-soft) items-center gap-2.5">
                <Avatar name={activeOther?.username ?? '?'} src={activeOther?.avatar} size="md" />
                <span className="text-base font-semibold text-(--text-primary)">{activeOther?.username ?? 'Unknown user'}</span>
                <button
                  onClick={() => handleDeleteConversation(active._id)}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded hover:bg-(--danger)/10 text-(--text-secondary) hover:text-(--danger) transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Mobile chat header (delete button) */}
              <div className="sm:hidden px-4 py-2 border-b border-(--border-soft) flex justify-end">
                <button
                  onClick={() => handleDeleteConversation(active._id)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-(--danger)/10 text-(--text-secondary) hover:text-(--danger) transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2">
                {active.messages.map(m => {
                  const senderId = typeof m.sender === 'string' ? m.sender : m.sender._id;
                  const isMine = senderId === myId;
                  return (
                    <div key={m._id} className={`flex group ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end font-medium gap-1.5 max-w-[85%] sm:max-w-[75%] ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className={`px-3 py-2 font-medium rounded-2xl text-sm leading-snug wrap-break-word
                          ${isMine ? 'bg-(--accent) text-white font-medium rounded-br-sm' : 'bg-(--bg-page) text-(--text-primary) rounded-bl-sm'}`}>
                          {m.content}
                        </div>
                        {isMine && (
                          <button
                            onClick={() => handleDeleteMessage(m._id)}
                            className="opacity-0 font-medium group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-(--text-muted) hover:text-(--danger) transition-opacity"
                            title="Delete message"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-(--border-soft) flex items-center gap-2">
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message…"
                  className="flex-1 bg-(--bg-page) border font-medium border-(--border-medium) rounded-lg px-3.5 py-2.5 sm:py-2 text-sm text-(--text-primary) placeholder:text-(--text-secondary) outline-none focus:border-(--accent) transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !draft.trim()}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-(--accent) cursor-pointer text-white disabled:opacity-50 hover:bg-(--accent-hover) transition-colors shrink-0"
                >
                  {sending
                    ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={14} />
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}