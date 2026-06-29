/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Link, Code, Quote,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Smile, Table, Minus, Eye, EyeOff,
  Heading1, Heading2, Type, MonitorPlay, Baseline, CaseSensitive, X,
} from "lucide-react";
import { FormatState } from "../../types/useRichEditor";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = [
  "😀","😂","😍","😎","🤔","😭","😡","🥳","👍","👎",
  "❤️","🔥","💯","🎉","✅","❌","⚠️","💡","📌","🚀",
  "🤣","😊","😏","🙄","😴","🤯","👀","💪","🙏","⭐",
];

const TEXT_COLORS = [
  { label: "Default",   value: "inherit"  },
  { label: "White",     value: "#ffffff"  },
  { label: "Red",       value: "#ff4d4d"  },
  { label: "Orange",    value: "#ff9500"  },
  { label: "Yellow",    value: "#ffd60a"  },
  { label: "Green",     value: "#30d158"  },
  { label: "Cyan",      value: "#5ac8fa"  },
  { label: "Blue",      value: "#4b8ef1"  },
  { label: "Purple",    value: "#bf5af2"  },
  { label: "Pink",      value: "#ff375f"  },
  { label: "Gray",      value: "#8a8d91"  },
  { label: "Dark gray", value: "#4a4b50"  },
];

const FONT_SIZES = [
  { label: "Small",  value: "12px" },
  { label: "Normal", value: "16px" },
  { label: "Medium", value: "20px" },
  { label: "Large",  value: "24px" },
  { label: "XL",     value: "32px" },
  { label: "XXL",    value: "40px" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVideoEmbedSrc(url: string): string | null {
  try {
    const u    = new URL(url);
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

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);
}

// Accepts a nullable ref (matches the MutableRefObject<HTMLDivElement | null>
// that useRichEditor / RichEditor actually hand down).
function insertIntoEditor(
  editorRef: React.RefObject<HTMLDivElement | null>,
  html: string
) {
  const editor = editorRef.current;
  if (!editor) return;

  editor.focus();

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      const lastNode = frag.lastChild;
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return;
    }
  }
  // Fallback: append at end
  editor.innerHTML += html;
  editor.focus();
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

// Capped + scrollable so popovers never grow past the editor / viewport,
// regardless of how much content (staged images, long lists) they hold.
function Popover({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-8 left-0 z-50 max-h-[min(32vh,220px)] overflow-y-auto bg-(--bg-elevated) border border-(--border-medium) rounded-lg p-3 shadow-xl">
      {children}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RichEditorToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
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

// ─── Toolbar ──────────────────────────────────────────────────────────────────

export function RichEditorToolbar({
  editorRef,
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
  // Popovers
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [showLink,   setShowLink]   = useState(false);
  const [showEmbed,  setShowEmbed]  = useState(false);
  const [showColor,  setShowColor]  = useState(false);
  const [showSize,   setShowSize]   = useState(false);

  // Link state
  const [linkUrl,  setLinkUrl]  = useState("");
  const [linkText, setLinkText] = useState("");

  // Embed state
  const [embedUrl,     setEmbedUrl]     = useState("");
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedError,   setEmbedError]   = useState("");
  const [imageUrls,    setImageUrls]    = useState<string[]>([]);

  // Color state
  const [activeColor, setActiveColor] = useState("inherit");
  const colorInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const closeAll = () => {
    setShowEmoji(false);
    setShowLink(false);
    setShowEmbed(false);
    setShowColor(false);
    setShowSize(false);
  };

  const openOnly = (open: () => void) => {
    closeAll();
    open();
  };

  // ── Link ───────────────────────────────────────────────────────────────────

  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const safeUrl = `/leaving?site=${encodeURIComponent(linkUrl)}`;
    onInsertLink(safeUrl, linkText || linkUrl);
    setShowLink(false);
    setLinkUrl("");
    setLinkText("");
  };

  // Probes whether a URL actually loads as an image — catches CDN/thumbnail
// URLs that have no file extension (e.g. gstatic, imgix, presigned S3 links).
function probeIsImage(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    let done = false;

    const settle = (result: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => settle(false), timeoutMs);

    img.onload = () => settle(true);
    img.onerror = () => settle(false);
    img.src = url;
  });
}

  // ── Embed / images ─────────────────────────────────────────────────────────

  const handleAddUrl = async () => {
    const url = embedUrl.trim();
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      setEmbedError("Enter a valid http(s) URL.");
      return;
    }

    // Video
    const videoSrc = getVideoEmbedSrc(url);
    if (videoSrc) {
      onInsertVideoEmbed(videoSrc);
      setShowEmbed(false);
      setEmbedUrl("");
      setEmbedError("");
      setImageUrls([]);
      return;
    }

    // Image — stage it
    if (isImageUrl(url)) {
      setImageUrls((prev) => [...prev, url]);
      setEmbedUrl("");
      setEmbedError("");
      return;
    }

    // Link preview card
    setEmbedLoading(true);
    setEmbedError("");

    const looksLikeImage = await probeIsImage(url);
  if (looksLikeImage) {
    setImageUrls((prev) => [...prev, url]);
    setEmbedUrl("");
    setEmbedLoading(false);
    return;
  }
    try {
      const res  = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok || !json?.data)
        throw new Error(json?.error ?? "Couldn't load a preview for that link.");
      onInsertLinkCard({
        ...json.data,
        url: `/leaving?site=${encodeURIComponent(url)}`,
      });
      setShowEmbed(false);
      setEmbedUrl("");
      setImageUrls([]);
    } catch (e: any) {
      setEmbedError(e?.message ?? "Couldn't load a preview for that link.");
    } finally {
      setEmbedLoading(false);
    }
  };

  const handleInsertImages = () => {
    if (imageUrls.length === 0) return;

    const cols  = Math.min(imageUrls.length, 3);
    const imgs  = imageUrls
      .map((u) => `<img src="${u}" class="editor-image" alt="" />`)
      .join("");
    const html  = `<div class="editor-image-grid editor-image-grid--${cols}">${imgs}</div><p><br></p>`;

    insertIntoEditor(editorRef, html);
    setImageUrls([]);
    setShowEmbed(false);
    setEmbedUrl("");
    setEmbedError("");
  };

  const removeImage = (idx: number) =>
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  // ── Color ──────────────────────────────────────────────────────────────────

  const handleColorSelect = (color: string) => {
    setActiveColor(color);
    if (color === "inherit") onExec("removeFormat");
    else onExec("foreColor", color);
    setShowColor(false);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setActiveColor(color);
    onExec("foreColor", color);
  };

  // ── Font size ──────────────────────────────────────────────────────────────

  const handleFontSize = (size: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const span = document.createElement("span");
    span.style.fontSize = size;
    try {
      range.surroundContents(span);
    } catch {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    setShowSize(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-(--border-soft) bg-(--bg-input)">

        {/* Headings */}
        <ToolbarButton icon={<Heading1 size={13} />} label="Heading 2" active={formatState.heading === "h2"} onClick={() => onInsertHeading("h2")} />
        <ToolbarButton icon={<Heading2 size={13} />} label="Heading 3" active={formatState.heading === "h3"} onClick={() => onInsertHeading("h3")} />
        <ToolbarButton icon={<Type size={13} />}     label="Paragraph" onClick={() => onExec("formatBlock", "p")} />
        <ToolbarDivider />

        {/* Inline format */}
        <ToolbarButton icon={<Bold size={13} />}          label="Bold"          active={formatState.bold}      onClick={() => onExec("bold")} />
        <ToolbarButton icon={<Italic size={13} />}        label="Italic"        active={formatState.italic}    onClick={() => onExec("italic")} />
        <ToolbarButton icon={<Underline size={13} />}     label="Underline"     active={formatState.underline} onClick={() => onExec("underline")} />
        <ToolbarButton icon={<Strikethrough size={13} />} label="Strikethrough" active={formatState.strike}    onClick={() => onExec("strikeThrough")} />
        <ToolbarDivider />

        {/* Text color */}
        <div className="relative">
          <button
            type="button"
            title="Text color"
            onClick={() => { onSaveSelection(); openOnly(() => setShowColor(true)); }}
            className={`w-7 h-7 flex flex-col items-center justify-center rounded gap-0.5 transition-all duration-100 cursor-pointer
              ${showColor ? "bg-(--accent)" : "hover:bg-(--bg-elevated)"}`}
          >
            <Baseline size={12} className={showColor ? "text-white" : "text-(--text-muted)"} />
            <div
              className="w-4 h-1 rounded-sm"
              style={{ backgroundColor: activeColor === "inherit" ? "var(--text-primary)" : activeColor }}
            />
          </button>
          {showColor && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Text color</p>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => handleColorSelect(c.value)}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      activeColor === c.value ? "border-(--accent) scale-110" : "border-transparent hover:border-(--border-medium)"
                    }`}
                    style={{ backgroundColor: c.value === "inherit" ? "var(--text-primary)" : c.value }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-(--border-soft)">
                <span className="text-[10px] text-(--text-muted)">Custom</span>
                <input
                  ref={colorInputRef}
                  type="color"
                  defaultValue="#ffffff"
                  onChange={handleCustomColor}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                />
              </div>
            </Popover>
          )}
        </div>

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            title="Font size"
            onClick={() => { onSaveSelection(); openOnly(() => setShowSize(true)); }}
            className={`h-7 px-1.5 flex items-center gap-0.5 rounded transition-all duration-100 cursor-pointer
              ${showSize ? "bg-(--accent) text-white" : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated)"}`}
          >
            <CaseSensitive size={13} />
          </button>
          {showSize && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Font size</p>
              <div className="flex flex-col gap-0.5 min-w-28">
                {FONT_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleFontSize(s.value)}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-(--bg-page) text-(--text-primary) transition-colors"
                  >
                    <span style={{ fontSize: s.value === "40px" ? "14px" : s.value === "32px" ? "13px" : s.value }} className="leading-none">A</span>
                    <span className="text-[11px] text-(--text-muted) ml-3">{s.label}</span>
                  </button>
                ))}
              </div>
            </Popover>
          )}
        </div>

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

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            icon={<Link size={13} />}
            label="Insert link"
            active={showLink}
            onClick={() => { onSaveSelection(); openOnly(() => setShowLink(true)); }}
          />
          {showLink && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Insert link</p>
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

        {/* Embed / images */}
        <div className="relative">
          <ToolbarButton
            icon={<MonitorPlay size={13} />}
            label="Embed image, video or link"
            active={showEmbed}
            onClick={() => { onSaveSelection(); openOnly(() => setShowEmbed(true)); }}
          />
          {showEmbed && (
            <Popover>
              <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">Embed image, video or link</p>

              {/* URL input row */}
              <div className="flex gap-1.5 mb-2">
                <input
                  autoFocus
                  placeholder="Paste a URL…"
                  value={embedUrl}
                  onChange={(e) => { setEmbedUrl(e.target.value); setEmbedError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                  className="flex-1 min-w-0 px-2 py-1.5 bg-(--bg-page) border border-(--border-soft) rounded text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) lg:w-32"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  disabled={embedLoading || !embedUrl.trim()}
                  className="shrink-0 px-2.5 py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) disabled:opacity-40 text-(--text-primary) text-xs rounded transition-colors"
                >
                  {embedLoading ? "…" : "Add"}
                </button>
              </div>

              {embedError && (
                <p className="text-[11px] text-(--danger) mb-2">{embedError}</p>
              )}

              {/* Staged image grid preview — scrolls on its own so it can't
                  eat the whole popover even with many staged images */}
              {imageUrls.length > 0 && (
                <div className="mb-3 max-h-32 overflow-y-auto pr-1">
                  <p className="text-[10px] text-(--text-muted) mb-1.5 sticky top-0 bg-(--bg-elevated)">
                    {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""} staged
                    — add more or insert
                  </p>
                  <div
                    className="grid gap-1 rounded-lg overflow-hidden"
                    style={{ gridTemplateColumns: `repeat(${Math.min(imageUrls.length, 3)}, 1fr)` }}
                  >
                    {imageUrls.map((u, i) => (
                      <div key={i} className="relative group aspect-square bg-(--bg-page)">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons — pinned to the bottom so they're always
                  reachable regardless of how tall the content above gets */}
              <div className="flex gap-2 sticky bottom-0 bg-(--bg-elevated) pt-2 pb-1 -mb-1">
                {imageUrls.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleInsertImages}
                    className="flex-1 py-1.5 bg-(--accent) hover:bg-(--accent-hover) text-white text-xs rounded transition-colors"
                  >
                    Insert {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={embedLoading || !embedUrl.trim()}
                    className="flex-1 py-1.5 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 text-white text-xs rounded transition-colors"
                  >
                    {embedLoading ? "Loading…" : "Insert"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowEmbed(false); setEmbedError(""); setImageUrls([]); setEmbedUrl(""); }}
                  className="px-3 py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-xs rounded transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[10px] text-(--text-muted) mt-2 leading-relaxed">
                Image URLs add to grid. YouTube/Vimeo embed as video. Other URLs show as a preview card.
              </p>
            </Popover>
          )}
        </div>

        {/* Emoji */}
        <div className="relative">
          <ToolbarButton
            icon={<Smile size={13} />}
            label="Emoji"
            active={showEmoji}
            onClick={() => { onSaveSelection(); openOnly(() => setShowEmoji(true)); }}
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

        <div className="flex-1" />

        {/* Preview toggle */}
        <ToolbarButton
          icon={preview ? <EyeOff size={13} /> : <Eye size={13} />}
          label={preview ? "Edit" : "Preview"}
          active={preview}
          onClick={onTogglePreview}
        />
      </div>

      {/* Click-outside overlay */}
      {(showEmoji || showLink || showEmbed || showColor || showSize) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}
    </>
  );
}