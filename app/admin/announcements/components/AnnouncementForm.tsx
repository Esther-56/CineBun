'use client';
import { useState, useRef } from 'react';
import { Link2, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import type { Announcement, AnnouncementInput } from '@/app/services/announcement';

interface Props {
  mode: 'create' | 'edit';
  initial?: Announcement;
  onSubmit: (data: AnnouncementInput) => Promise<void>;
  onCancel?: () => void;
}

const TYPES = ['info', 'warning', 'success', 'danger'] as const;

export default function AnnouncementForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [message, setMessage] = useState(initial?.message ?? '');
  const [type, setType] = useState<Announcement['type']>(initial?.type ?? 'info');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [notifyByEmail, setNotifyByEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertLink = () => {
    if (!linkUrl) return;
    const label = linkLabel || linkUrl;
    const syntax = `[${label}](${linkUrl})`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = message.slice(0, start) + syntax + message.slice(end);
      setMessage(next);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + syntax.length, start + syntax.length);
      }, 0);
    } else {
      setMessage(m => m + syntax);
    }
    setLinkUrl('');
    setLinkLabel('');
    setShowLinkPopover(false);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        message: message.trim(),
        type,
        isActive,
        ...(mode === 'create' ? { notifyByEmail } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-[#25262a] border border-[#2d2e32] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#8a8d91] uppercase tracking-widest">
          {mode === 'create' ? 'New Announcement' : 'Edit Announcement'}
        </p>
        <button
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-1 text-[10px] text-[#4b8ef1] hover:text-[#6ba3f5] transition-colors"
        >
          {preview ? <EyeOff size={10} /> : <Eye size={10} />}
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-1.5">
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`text-[10px] px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
              type === t
                ? 'bg-[#4b8ef1] text-white'
                : 'bg-[#2d2e32] text-[#8a8d91] hover:text-[#e4e6eb]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Message area */}
      {preview ? (
        <div className="min-h-22.5 text-[13px] text-[#c9cdd4] bg-[#1b1c1f] border border-[#2d2e32] rounded-lg px-3 py-2.5 leading-relaxed">
          <RichText text={message} />
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your announcement… Use [label](url) for links, press Enter for new paragraphs."
            rows={4}
            className="w-full text-[13px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] focus:border-[#4b8ef1] rounded-lg px-3 py-2.5 outline-none resize-y leading-relaxed transition-colors"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1 mt-1.5 relative">
            <button
              onClick={() => setShowLinkPopover(v => !v)}
              className="flex items-center gap-1 text-[10px] px-2 py-1 text-[#8a8d91] hover:text-[#4b8ef1] bg-[#2d2e32] hover:bg-[#363739] rounded transition-colors"
              title="Insert link"
            >
              <Link2 size={10} /> Link
            </button>
            <span className="text-[10px] text-[#4a4b50] ml-1">
              Tip: Enter = new line, [label](url) = link
            </span>

            {showLinkPopover && (
              <div className="absolute left-0 top-7 z-20 bg-[#25262a] border border-[#3a3b40] rounded-lg shadow-xl p-3 flex flex-col gap-2 w-72">
                <input
                  value={linkLabel}
                  onChange={e => setLinkLabel(e.target.value)}
                  placeholder="Link label (optional)"
                  className="text-[12px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] rounded-md px-2.5 py-1.5 outline-none focus:border-[#4b8ef1]"
                />
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-[12px] text-[#c9cdd4] placeholder-[#4a4b50] bg-[#1b1c1f] border border-[#2d2e32] rounded-md px-2.5 py-1.5 outline-none focus:border-[#4b8ef1]"
                  onKeyDown={e => e.key === 'Enter' && insertLink()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={insertLink}
                    className="flex-1 text-[11px] py-1.5 bg-[#4b8ef1] hover:bg-[#6ba3f5] text-white rounded-md transition-colors"
                  >
                    Insert
                  </button>
                  <button
                    onClick={() => setShowLinkPopover(false)}
                    className="text-[11px] px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] text-[#8a8d91] rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active + notify toggles */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div
            onClick={() => setIsActive(v => !v)}
            className={`w-7 h-4 rounded-full transition-colors relative ${isActive ? 'bg-[#4b8ef1]' : 'bg-[#2d2e32]'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-[11px] text-[#8a8d91]">{isActive ? 'Active' : 'Inactive'}</span>
        </label>

        {mode === 'create' && (
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <div
              onClick={() => setNotifyByEmail(v => !v)}
              className={`w-7 h-4 rounded-full transition-colors relative ${notifyByEmail ? 'bg-[#f59e0b]' : 'bg-[#2d2e32]'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${notifyByEmail ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-[11px] text-[#8a8d91] flex items-center gap-1">
              <Mail size={10} /> Email all users
            </span>
          </label>
        )}
      </div>

      {mode === 'create' && notifyByEmail && (
        <p className="text-[10px] text-[#f59e0b]/80 -mt-1.5">
          This will send an email to every verified user. Use for important updates only.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !message.trim()}
          className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 bg-[#4b8ef1] hover:bg-[#6ba3f5] disabled:opacity-40 text-white rounded-md transition-colors"
        >
          {saving && <Loader2 size={10} className="animate-spin" />}
          {mode === 'create' ? 'Create' : 'Save changes'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-[11px] px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] text-[#8a8d91] rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Shared rich text renderer — exported so AnnouncementBoard can use it too
export function RichText({ text }: { text: string }) {
  const paragraphs = text.split('\n');
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className={pi > 0 ? 'mt-2' : ''}>
          <ParsedLine text={para} />
        </p>
      ))}
    </>
  );
}

function ParsedLine({ text }: { text: string }) {
  const parts: Array<{ type: 'text' | 'link'; content: string; href?: string }> = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', content: text.slice(last, match.index) });
    parts.push({ type: 'link', content: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) });

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4b8ef1] hover:text-[#6ba3f5] underline underline-offset-2 transition-colors"
          >
            {part.content}
          </a>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}