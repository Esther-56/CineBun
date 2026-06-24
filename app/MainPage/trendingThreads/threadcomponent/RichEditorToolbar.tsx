/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Link, Code, Quote,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Smile, Table, Minus, Eye, EyeOff,
  Heading1, Heading2, Type, MonitorPlay,
} from "lucide-react";
import { FormatState } from "../../types/useRichEditor";

// ─── Emoji list ───────────────────────────────────────────────────────────────
const EMOJIS = [
  "😀","😂","😍","😎","🤔","😭","😡","🥳","👍","👎",
  "❤️","🔥","💯","🎉","✅","❌","⚠️","💡","📌","🚀",
  "🤣","😊","😏","🙄","😴","🤯","👀","💪","🙏","⭐",
];

// ─── Utility: detect video embed src ─────────────────────────────────────────
function getVideoEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id =
        u.searchParams.get("v") ??
        u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/)?.[1] ??
        u.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Primitive components ─────────────────────────────────────────────────────
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, active, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        w-7 h-7 flex items-center justify-center rounded text-xs transition-all duration-100
        ${active
          ? "bg-(--accent) text-white"
          : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated)"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-(--border-soft) mx-0.5 shrink-0" />;
}

// ─── Popover shell ────────────────────────────────────────────────────────────
function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-8 left-0 z-50 bg-(--bg-elevated) border border-(--border-medium) rounded-lg p-3 shadow-xl">
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface RichEditorToolbarProps {
  formatState: FormatState;
  preview: boolean;
  onTogglePreview: () => void;
  onExec: (cmd: string, value?: string) => void;
  onInsertHeading: (tag: string) => void;
  onInsertHR: () => void;
  onInsertCode: () => void;
  onInsertQuote: () => void;
  onInsertTable: () => void;
  onInsertEmoji: (emoji: string) => void;
  onInsertLink: (url: string, displayText?: string) => void;
  onInsertVideoEmbed: (src: string) => void;
  onInsertLinkCard: (meta: {
    url: string; title: string; description: string; image: string; siteName: string;
  }) => void;
  onSaveSelection: () => void;
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────
export function RichEditorToolbar({
  formatState,
  preview,
  onTogglePreview,
  onExec,
  onInsertHeading,
  onInsertHR,
  onInsertCode,
  onInsertQuote,
  onInsertTable,
  onInsertEmoji,
  onInsertLink,
  onInsertVideoEmbed,
  onInsertLinkCard,
  onSaveSelection,
}: RichEditorToolbarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLink, setShowLink]   = useState(false);
  const [linkUrl, setLinkUrl]     = useState("");
  const [linkText, setLinkText]   = useState("");

  const [showEmbed, setShowEmbed]       = useState(false);
  const [embedUrl, setEmbedUrl]         = useState("");
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedError, setEmbedError]     = useState("");

  const closeAll = () => { setShowEmoji(false); setShowLink(false); setShowEmbed(false); };

const handleInsertLink = () => {
  if (!linkUrl.trim()) return;
  const safeUrl = `/leaving?site=${encodeURIComponent(linkUrl)}`;
  onInsertLink(safeUrl, linkText || linkUrl);
  setShowLink(false);
  setLinkUrl("");
  setLinkText("");
};

const handleInsertEmbed = async () => {
  const url = embedUrl.trim();
  if (!url) return;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    setEmbedError("Enter a valid http(s) URL.");
    return;
  }

  const videoSrc = getVideoEmbedSrc(url);
  if (videoSrc) {
    // Videos go direct — no leaving page for embeds
    onInsertVideoEmbed(videoSrc);
    setShowEmbed(false);
    setEmbedUrl("");
    setEmbedError("");
    return;
  }

  setEmbedLoading(true);
  setEmbedError("");
  try {
    const res  = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    const json = await res.json();
    if (!res.ok || !json?.data) throw new Error(json?.error ?? "Couldn't load a preview for that link.");

    onInsertLinkCard({
      ...json.data,
      url: `/leaving?site=${encodeURIComponent(url)}`,
    });

    setShowEmbed(false);
    setEmbedUrl("");
  } catch (e: any) {
    setEmbedError(e?.message ?? "Couldn't load a preview for that link.");
  } finally {
    setEmbedLoading(false);
  }
};

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-(--border-soft) bg-(--bg-input)">

        {/* Headings */}
        <ToolbarButton icon={<Heading1 size={13} />} label="Heading 2" active={formatState.heading === "h2"} onClick={() => onInsertHeading("h2")} />
        <ToolbarButton icon={<Heading2 size={13} />} label="Heading 3" active={formatState.heading === "h3"} onClick={() => onInsertHeading("h3")} />
        <ToolbarButton icon={<Type size={13} />}     label="Paragraph" onClick={() => onExec("formatBlock", "p")} />
        <ToolbarDivider />

        {/* Text format */}
        <ToolbarButton icon={<Bold size={13} />}          label="Bold"          active={formatState.bold}      onClick={() => onExec("bold")} />
        <ToolbarButton icon={<Italic size={13} />}        label="Italic"        active={formatState.italic}    onClick={() => onExec("italic")} />
        <ToolbarButton icon={<Underline size={13} />}     label="Underline"     active={formatState.underline} onClick={() => onExec("underline")} />
        <ToolbarButton icon={<Strikethrough size={13} />} label="Strikethrough" active={formatState.strike}    onClick={() => onExec("strikeThrough")} />
        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton icon={<AlignLeft size={13} />}   label="Align left"   active={formatState.alignLeft}   onClick={() => onExec("justifyLeft")} />
        <ToolbarButton icon={<AlignCenter size={13} />} label="Align center" active={formatState.alignCenter} onClick={() => onExec("justifyCenter")} />
        <ToolbarButton icon={<AlignRight size={13} />}  label="Align right"  active={formatState.alignRight}  onClick={() => onExec("justifyRight")} />
        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton icon={<List size={13} />}        label="Bullet list"   onClick={() => onExec("insertUnorderedList")} />
        <ToolbarButton icon={<ListOrdered size={13} />} label="Numbered list" onClick={() => onExec("insertOrderedList")} />
        <ToolbarDivider />

        {/* Blocks */}
        <ToolbarButton icon={<Code size={13} />}  label="Code block" active={formatState.isCode}  onClick={onInsertCode} />
        <ToolbarButton icon={<Quote size={13} />} label="Quote"      active={formatState.isQuote} onClick={onInsertQuote} />
        <ToolbarButton icon={<Table size={13} />} label="Table"                                   onClick={onInsertTable} />
        <ToolbarButton icon={<Minus size={13} />} label="Divider"                                 onClick={onInsertHR} />
        <ToolbarDivider />

        {/* Link popover */}
        <div className="relative">
          <ToolbarButton
            icon={<Link size={13} />}
            label="Insert link"
            active={showLink}
            onClick={() => { onSaveSelection(); setShowLink((v) => !v); setShowEmbed(false); setShowEmoji(false); }}
          />
          {showLink && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Insert Link</p>
              <input
                autoFocus
                placeholder="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mb-2 px-2 py-1.5 bg-(--bg-page) border border-(--border-soft) rounded text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) lg:w-64 w-full"
              />
              <input
                placeholder="Display text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
                className="w-full mb-2 px-2 py-1.5 bg-(--bg-page) border border-(--border-soft) rounded text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
              />
              <div className="flex gap-2">
                <button onClick={handleInsertLink} className="flex-1 py-1.5 bg-(--accent) hover:bg-(--accent-hover) text-white text-xs rounded transition-colors">Insert</button>
                <button onClick={() => setShowLink(false)} className="px-3 py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-xs rounded transition-colors">Cancel</button>
              </div>
            </Popover>
          )}
        </div>

        {/* Embed popover */}
        <div className="relative">
          <ToolbarButton
            icon={<MonitorPlay size={13} />}
            label="Embed video or link"
            active={showEmbed}
            onClick={() => { onSaveSelection(); setShowEmbed((v) => !v); setShowLink(false); setShowEmoji(false); }}
          />
          {showEmbed && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Embed video or link</p>
              <input
                autoFocus
                placeholder="Paste a YouTube, Vimeo, or any URL"
                value={embedUrl}
                onChange={(e) => { setEmbedUrl(e.target.value); setEmbedError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleInsertEmbed()}
                className="mb-2 px-2 py-1.5 bg-(--bg-page) border border-(--border-soft) rounded text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) lg:w-64 w-full"
              />
              {embedError && <p className="text-[11px] text-(--danger) mb-2">{embedError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleInsertEmbed}
                  disabled={embedLoading || !embedUrl.trim()}
                  className="flex-1 py-1.5 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 text-white text-xs rounded transition-colors"
                >
                  {embedLoading ? "Loading…" : "Insert"}
                </button>
                <button
                  onClick={() => { setShowEmbed(false); setEmbedError(""); }}
                  className="px-3 py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-(--text-muted) mt-2">YouTube &amp; Vimeo embed as video. Other links show as a preview card.</p>
            </Popover>
          )}
        </div>

        {/* Emoji popover */}
        <div className="relative">
          <ToolbarButton
            icon={<Smile size={13} />}
            label="Emoji"
            active={showEmoji}
            onClick={() => { onSaveSelection(); setShowEmoji((v) => !v); setShowLink(false); setShowEmbed(false); }}
          />
          {showEmoji && (
            <Popover>
              <div className="grid grid-cols-6 gap-0.5 w-44">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onInsertEmoji(e); setShowEmoji(false); }}
                    className="w-7 h-7 flex items-center justify-center text-base hover:bg-(--bg-elevated) rounded transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </Popover>
          )}
        </div>

        {/* Spacer + preview toggle */}
        <div className="flex-1" />
        <ToolbarButton
          icon={preview ? <EyeOff size={13} /> : <Eye size={13} />}
          label={preview ? "Edit" : "Preview"}
          active={preview}
          onClick={onTogglePreview}
        />
      </div>

      {/* Click-outside overlay to close all popovers */}
      {(showEmoji || showLink || showEmbed) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </>
  );
}