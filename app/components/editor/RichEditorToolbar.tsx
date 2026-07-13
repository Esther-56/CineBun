/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, Code, Quote,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Smile, Table as TableIcon, Minus, Eye, EyeOff,
  Heading1, Heading2, Type, MonitorPlay, Baseline, CaseSensitive, X, Upload, ImagePlus, Image as ImageIcon,
  ChevronRight, ChevronLeft,
} from "lucide-react";

// ─── Constants (unchanged from the original toolbar) ───────────────────────────

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

const MAX_UPLOAD_BYTES = 1 * 1024 * 1024; // 1MB, matches the API route

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Recognizes known video sources and returns a purpose-built embeddable
// iframe src. Falls back to embedding the raw URL for anything else —
// no restriction on what can be embedded.
function getVideoEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname;

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id =
        u.searchParams.get("v") ??
        path.match(/\/shorts\/([a-zA-Z0-9_-]+)/)?.[1] ??
        path.match(/\/embed\/([a-zA-Z0-9_-]+)/)?.[1];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "youtu.be") {
      const id = path.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    // Vimeo
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = path.match(/\/(\d+)/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    // Dailymotion
    if (host === "dailymotion.com") {
      const id = path.match(/\/video\/([a-zA-Z0-9]+)/)?.[1];
      if (id) return `https://www.dailymotion.com/embed/video/${id}`;
    }
    if (host === "dai.ly") {
      const id = path.slice(1);
      if (id) return `https://www.dailymotion.com/embed/video/${id}`;
    }

    // Loom
    if (host === "loom.com") {
      const id = path.match(/\/share\/([a-zA-Z0-9]+)/)?.[1];
      if (id) return `https://www.loom.com/embed/${id}`;
    }

    // Streamable
    if (host === "streamable.com") {
      const id = path.match(/^\/([a-zA-Z0-9]+)/)?.[1];
      if (id) return `https://streamable.com/e/${id}`;
    }

    // Wistia
    if (host.endsWith("wistia.com") || host.endsWith("wistia.net")) {
      const id =
        path.match(/\/medias\/([a-zA-Z0-9]+)/)?.[1] ??
        path.match(/\/iframe\/([a-zA-Z0-9]+)/)?.[1];
      if (id) return `https://fast.wistia.net/embed/iframe/${id}`;
    }

    // Twitch (videos, clips, live channel)
    if (host === "twitch.tv" || host === "m.twitch.tv" || host === "clips.twitch.tv") {
      const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
      if (host === "clips.twitch.tv") {
        const clip = path.slice(1);
        if (clip) return `https://clips.twitch.tv/embed?clip=${clip}&parent=${parent}`;
      }
      const clipMatch = path.match(/\/clip\/([a-zA-Z0-9-]+)/)?.[1];
      if (clipMatch) return `https://clips.twitch.tv/embed?clip=${clipMatch}&parent=${parent}`;
      const vid = path.match(/\/videos\/(\d+)/)?.[1];
      if (vid) return `https://player.twitch.tv/?video=${vid}&parent=${parent}`;
      const channel = path.match(/^\/([a-zA-Z0-9_]+)\/?$/)?.[1];
      if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${parent}`;
    }

    // TikTok
    if (host === "tiktok.com") {
      const id = path.match(/\/video\/(\d+)/)?.[1];
      if (id) return `https://www.tiktok.com/embed/v2/${id}`;
    }

    // Facebook video
    if (host === "facebook.com" || host === "fb.watch") {
      if (host === "fb.watch" || /\/videos\//.test(path)) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
      }
    }

    // Direct video files — browsers render these natively inside an iframe
    if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(path)) {
      return url;
    }

    // Already a known embed/player URL
    if (/\/(e|embed|player)\/[a-zA-Z0-9_-]+/.test(path)) return url;

    // Fallback — no restriction, embed anything else directly
    return url;
  } catch {
    return null;
  }
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);
}

function probeIsImage(url: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    let done = false;
    const settle = (r: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(r);
    };
    const timer = setTimeout(() => settle(false), timeoutMs);
    img.onload = () => settle(true);
    img.onerror = () => settle(false);
    img.src = url;
  });
}

function validateHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Primitives ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  icon, label, onClick, active, disabled,
}: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        shrink-0 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center rounded-md sm:rounded text-xs transition-all duration-100
        ${active ? "bg-(--accent) text-white" : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated)"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer active:scale-95"}
      `}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-(--border-soft) mx-0.5 shrink-0" />;
}

// Popover: on mobile this renders as a bottom sheet anchored to the
// viewport (full width, safe-area aware, with a drag handle + close
// button) so it never gets clipped by the screen edge. On sm+ screens it
// renders as the original small anchored dropdown.
function Popover({
  children,
  onClose,
  title,
  widthClass = "sm:w-72",
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  widthClass?: string;
}) {
  return (
    <>
      {/* Mobile bottom sheet */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-(--border-medium) bg-(--bg-elevated) shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-(--bg-elevated) pt-2 pb-1 px-4 flex items-center justify-center">
          <div className="h-1 w-10 rounded-full bg-(--border-medium)" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-2 w-8 h-8 flex items-center justify-center rounded-full text-(--text-muted) hover:bg-(--bg-page) active:scale-95"
          >
            <X size={16} />
          </button>
        </div>
        {title && (
          <p className="px-4 pt-1 pb-2 text-[11px] font-medium text-(--text-muted) uppercase tracking-wide">
            {title}
          </p>
        )}
        <div className="px-4 pb-4">{children}</div>
      </div>

      {/* Desktop anchored dropdown */}
      <div
        className={`hidden sm:block absolute top-9 right-0 z-50 max-h-[min(32vh,220px)] overflow-y-auto bg-(--bg-elevated) border border-(--border-medium) rounded-lg p-3 shadow-xl ${widthClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <p className="text-[10px] text-(--text-muted) uppercase tracking-wide mb-2">{title}</p>
        )}
        {children}
      </div>
    </>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface RichEditorToolbarProps {
  editor: Editor;
  preview: boolean;
  onTogglePreview: () => void;
}

// ─── Toolbar ───────────────────────────────────────────────────────────────────

export function RichEditorToolbar({ editor, preview, onTogglePreview }: RichEditorToolbarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showSize, setShowSize] = useState(false);

  // ── Link popover state (Text / Card / Button) ───────────────────────────
  const [linkMode, setLinkMode] = useState<"text" | "card" | "button">("text");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);

  // ── Image popover state (URL-add + device upload only) ──────────────────
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // ── Video embed popover state ────────────────────────────────────────────
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedError, setEmbedError] = useState("");

  const [activeColor, setActiveColor] = useState("inherit");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Mobile "more tools off screen" affordance ────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
 const [canScrollLeft, setCanScrollLeft] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
        const maxScrollLeft = el.scrollWidth - el.clientWidth;

  setCanScrollLeft(el.scrollLeft > 4);
  setCanScrollRight(el.scrollLeft < maxScrollLeft - 4);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      ro.disconnect();
    };
  }, []);

  const scrollToolbarRight = () => {
    scrollRef.current?.scrollBy({ left: 140, behavior: "smooth" });
  };
   const scrollToolbarLeft = () => {
    scrollRef.current?.scrollBy({ left: -140, behavior: "smooth" });
  };

  const closeAll = () => {
    setShowEmoji(false);
    setShowLink(false);
    setShowImage(false);
    setShowEmbed(false);
    setShowColor(false);
    setShowSize(false);
  };

  const openOnly = (setter: (v: boolean) => void) => {
    closeAll();
    setter(true);
  };

  // ── Link ───────────────────────────────────────────────────────────────────

  const resetLinkState = () => {
    setShowLink(false);
    setLinkMode("text");
    setLinkUrl("");
    setLinkText("");
    setLinkError("");
  };

  const handleInsertLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;

    if (!validateHttpUrl(url)) {
      setLinkError("Enter a valid http(s) URL.");
      return;
    }

    const safeUrl = `/leaving?site=${encodeURIComponent(url)}`;

    if (linkMode === "text") {
      const text = linkText || url;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text,
          marks: [{ type: "link", attrs: { href: safeUrl } }],
        })
        .run();
      resetLinkState();
      return;
    }

    if (linkMode === "button") {
      const text = linkText || "Learn more";
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text,
          marks: [
            {
              type: "link",
              attrs: {
                href: safeUrl,
                class: "link-btn",
                style:
                  "display:inline-block;padding:4px 8px;border-radius:3px;background:var(--accent);color:#fff;text-decoration:none;font-weight:500;font-size:13px;letter-spacing:0.01em;box-shadow:0 2px 8px rgba(0,0,0,0.25),0 1px 2px rgba(0,0,0,0.15);",
              },
            },
          ],
        })
        .run();
      resetLinkState();
      return;
    }

    // linkMode === "card"
    setLinkLoading(true);
    setLinkError("");
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok || !json?.data) throw new Error(json?.error ?? "Couldn't build a link card for that URL.");
      editor
        .chain()
        .focus()
        .setLinkCard({ ...json.data, url: safeUrl })
        .run();
      resetLinkState();
    } catch (e: any) {
      setLinkError(e?.message ?? "Couldn't build a link card for that URL. Try Text or Button instead.");
    } finally {
      setLinkLoading(false);
    }
  };

  // ── Image: URL add ────────────────────────────────────────────────────────

  const resetImageState = () => {
    setShowImage(false);
    setImageUrlInput("");
    setImageError("");
    setImageUrls([]);
  };

  const handleAddImageUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) return;

    if (!validateHttpUrl(url)) {
      setImageError("Enter a valid http(s) URL.");
      return;
    }

    if (isImageUrl(url)) {
      setImageUrls((prev) => [...prev, url]);
      setImageUrlInput("");
      setImageError("");
      return;
    }

    // Probe unknown URLs — some image CDNs have no file extension
    setImageLoading(true);
    setImageError("");
    const looksLikeImage = await probeIsImage(url);
    setImageLoading(false);
    if (looksLikeImage) {
      setImageUrls((prev) => [...prev, url]);
      setImageUrlInput("");
      return;
    }

    setImageError("That doesn't look like an image. Use the Embed video tool instead.");
  };

  // ── Image: device upload ─────────────────────────────────────────────────

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;

    setImageError("");
    setImageLoading(true);
    try {
      for (const file of files) {
        if (file.size > MAX_UPLOAD_BYTES) {
          setImageError(`${file.name} is over 1MB and was skipped.`);
          continue;
        }
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json?.data?.url) {
          setImageError(json?.error ?? `Couldn't upload ${file.name}.`);
          continue;
        }
        setImageUrls((prev) => [...prev, json.data.url]);
      }
    } finally {
      setImageLoading(false);
    }
  };

  const handleInsertImages = () => {
    if (imageUrls.length === 0) return;
    editor.chain().focus().setImageGrid(imageUrls).run();
    resetImageState();
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  // ── Video embed ───────────────────────────────────────────────────────────

  const resetEmbedState = () => {
    setShowEmbed(false);
    setEmbedUrl("");
    setEmbedError("");
  };

  const handleAddEmbed = () => {
    const url = embedUrl.trim();
    if (!url) return;

    if (!validateHttpUrl(url)) {
      setEmbedError("Enter a valid http(s) URL.");
      return;
    }

    if (isImageUrl(url)) {
      setEmbedError("That's an image link — use the Insert Image tool instead.");
      return;
    }

    const videoSrc = getVideoEmbedSrc(url);
    if (videoSrc) {
      editor.chain().focus().setVideoEmbed(videoSrc).run();
      resetEmbedState();
      return;
    }

    setEmbedError("Couldn't embed that link.");
  };

  // ── Color ──────────────────────────────────────────────────────────────────

  const handleColorSelect = (color: string) => {
    setActiveColor(color);
    if (color === "inherit") editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(color).run();
    setShowColor(false);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setActiveColor(color);
    editor.chain().focus().setColor(color).run();
  };

  // ── Font size ──────────────────────────────────────────────────────────────

  const handleFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run();
    setShowSize(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="relative">
                {canScrollLeft && (
          <div className="sm:hidden pointer-events-none absolute left-0 top-0 bottom-0 flex items-center">
            <div className="w-10 h-full bg-linear-to-l from-(--bg-input) to-transparent" />
            <button
              type="button"
              aria-label="More tools"
              onClick={scrollToolbarLeft}
              className="pointer-events-auto -ml-7 mr-1 w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-(--accent) text-white shadow-md active:scale-95 transition-transform"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        )}
        <div
          ref={scrollRef}
          className="flex items-center gap-0.5 px-2 py-1.5 border-b border-(--border-soft) bg-(--bg-input) overflow-x-auto sm:flex-wrap sm:overflow-visible [-webkit-overflow-scrolling:touch] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >

          {/* Headings */}
          <ToolbarButton icon={<Heading1 size={13} />} label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolbarButton icon={<Heading2 size={13} />} label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <ToolbarButton icon={<Type size={13} />} label="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} />
          <ToolbarDivider />

          {/* Inline format */}
          <ToolbarButton icon={<Bold size={13} />} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolbarButton icon={<Italic size={13} />} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolbarButton icon={<UnderlineIcon size={13} />} label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <ToolbarButton icon={<Strikethrough size={13} />} label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
          <ToolbarDivider />

          {/* Text color */}
          <div className="relative shrink-0">
            <button
              type="button"
              title="Text color"
              aria-label="Text color"
              onClick={() => openOnly(setShowColor)}
              className={`w-9 h-9 sm:w-7 sm:h-7 flex flex-col items-center justify-center rounded-md sm:rounded gap-0.5 transition-all duration-100 cursor-pointer active:scale-95
                ${showColor ? "bg-(--accent)" : "hover:bg-(--bg-elevated)"}`}
            >
              <Baseline size={12} className={showColor ? "text-white" : "text-(--text-muted)"} />
              <div className="w-4 h-1 rounded-sm" style={{ backgroundColor: activeColor === "inherit" ? "var(--text-primary)" : activeColor }} />
            </button>
            {showColor && (
              <Popover onClose={() => setShowColor(false)} title="Text color" widthClass="sm:w-56">
                <div className="grid grid-cols-6 gap-2 sm:gap-1 mb-3 sm:mb-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => handleColorSelect(c.value)}
                      className={`w-9 h-9 sm:w-6 sm:h-6 rounded-lg sm:rounded border-2 transition-all active:scale-95 ${activeColor === c.value ? "border-(--accent) scale-110" : "border-transparent hover:border-(--border-medium)"}`}
                      style={{ backgroundColor: c.value === "inherit" ? "var(--text-primary)" : c.value }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-(--border-soft)">
                  <span className="text-[11px] sm:text-[10px] text-(--text-muted)">Custom</span>
                  <input ref={colorInputRef} type="color" defaultValue="#ffffff" onChange={handleCustomColor} className="w-9 h-9 sm:w-6 sm:h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                </div>
              </Popover>
            )}
          </div>

          {/* Font size */}
          <div className="relative shrink-0">
            <button
              type="button"
              title="Font size"
              aria-label="Font size"
              onClick={() => openOnly(setShowSize)}
              className={`h-9 sm:h-7 px-2 sm:px-1.5 flex items-center gap-0.5 rounded-md sm:rounded transition-all duration-100 cursor-pointer active:scale-95
                ${showSize ? "bg-(--accent) text-white" : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated)"}`}
            >
              <CaseSensitive size={13} />
            </button>
            {showSize && (
              <Popover onClose={() => setShowSize(false)} title="Font size" widthClass="sm:w-44">
                <div className="flex flex-col gap-1 sm:gap-0.5">
                  {FONT_SIZES.map((s) => (
                    <button key={s.value} type="button" onClick={() => handleFontSize(s.value)} className="flex items-center justify-between px-3 sm:px-2 py-2.5 sm:py-1.5 rounded-lg sm:rounded hover:bg-(--bg-page) active:bg-(--bg-page) text-(--text-primary) transition-colors">
                      <span style={{ fontSize: s.value === "40px" ? "14px" : s.value === "32px" ? "13px" : s.value }} className="leading-none">A</span>
                      <span className="text-sm sm:text-[11px] text-(--text-muted) ml-3">{s.label}</span>
                    </button>
                  ))}
                </div>
              </Popover>
            )}
          </div>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton icon={<AlignLeft size={13} />} label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
          <ToolbarButton icon={<AlignCenter size={13} />} label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
          <ToolbarButton icon={<AlignRight size={13} />} label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton icon={<List size={13} />} label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolbarButton icon={<ListOrdered size={13} />} label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolbarDivider />

          {/* Blocks */}
          <ToolbarButton icon={<Code size={13} />} label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
          <ToolbarButton icon={<Quote size={13} />} label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <ToolbarButton
            icon={<TableIcon size={13} />}
            label="Table"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          />
          <ToolbarButton icon={<Minus size={13} />} label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          <ToolbarDivider />

          {/* Link (Text / Card / Button) */}
          <div className="relative shrink-0">
            <ToolbarButton icon={<LinkIcon size={13} />} label="Insert link" active={showLink} onClick={() => openOnly(setShowLink)} />
            {showLink && (
              <Popover onClose={resetLinkState} title="Insert link" widthClass="sm:w-72">
                <div className="flex gap-1 mb-3 sm:mb-2 bg-(--bg-page) p-0.5 rounded-lg">
                  {(["text", "card", "button"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setLinkMode(mode); setLinkError(""); }}
                      className={`flex-1 py-2 sm:py-1 text-sm sm:text-[11px] rounded-md capitalize transition-colors ${
                        linkMode === mode ? "bg-(--accent) text-white" : "text-(--text-muted) hover:text-(--text-primary)"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <input
                  autoFocus
                  placeholder="URL"
                  inputMode="url"
                  value={linkUrl}
                  onChange={(e) => { setLinkUrl(e.target.value); setLinkError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && linkMode !== "card" && handleInsertLink()}
                  className="mb-2 w-full px-3 sm:px-2 py-2.5 sm:py-1.5 bg-(--bg-page) border border-(--border-soft) rounded-lg sm:rounded text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
                />

                {linkMode !== "card" && (
                  <input
                    placeholder={linkMode === "button" ? "Button label (optional)" : "Display text (optional)"}
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
                    className="w-full mb-2 px-3 sm:px-2 py-2.5 sm:py-1.5 bg-(--bg-page) border border-(--border-soft) rounded-lg sm:rounded text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
                  />
                )}

                {linkMode === "card" && (
                  <p className="text-xs sm:text-[10px] text-(--text-muted) mb-2 leading-relaxed">
                    {"Builds a preview card from the page's title, image, and description."}
                  </p>
                )}

                {linkError && <p className="text-xs sm:text-[11px] text-(--danger) mb-2">{linkError}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleInsertLink}
                    disabled={linkLoading || !linkUrl.trim()}
                    className="flex-1 py-2.5 sm:py-1.5 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 text-white text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]"
                  >
                    {linkLoading ? "Loading…" : "Insert"}
                  </button>
                  <button onClick={resetLinkState} className="px-4 sm:px-3 py-2.5 sm:py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]">Cancel</button>
                </div>
              </Popover>
            )}
          </div>

          {/* Image (URL + device upload → grid) */}
          <div className="relative shrink-0">
            <ToolbarButton icon={<ImageIcon size={13} />} label="Insert image" active={showImage} onClick={() => openOnly(setShowImage)} />
            {showImage && (
              <Popover onClose={resetImageState} title="Insert image" widthClass="sm:w-80">
                <div className="flex gap-1.5 mb-2">
                  <input
                    autoFocus
                    placeholder="Paste an image URL…"
                    inputMode="url"
                    value={imageUrlInput}
                    onChange={(e) => { setImageUrlInput(e.target.value); setImageError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddImageUrl()}
                    className="flex-1 min-w-0 px-3 sm:px-2 py-2.5 sm:py-1.5 bg-(--bg-page) border border-(--border-soft) rounded-lg sm:rounded text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={imageLoading || !imageUrlInput.trim()}
                    className="shrink-0 px-3.5 sm:px-2.5 py-2.5 sm:py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) disabled:opacity-40 text-(--text-primary) text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]"
                  >
                    {imageLoading ? "…" : "Add"}
                  </button>
                </div>

                <div className="mb-2">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple className="hidden" onChange={handleFilesSelected} />
                  <button
                    type="button"
                    onClick={handleFilePick}
                    disabled={imageLoading}
                    className="w-full flex items-center justify-center gap-1.5 py-3 sm:py-1.5 bg-(--bg-page) border border-dashed border-(--border-medium) hover:border-(--accent) active:border-(--accent) disabled:opacity-40 text-(--text-secondary) text-sm sm:text-xs rounded-lg sm:rounded transition-colors"
                  >
                    <Upload size={14} /> Upload from device
                  </button>
                </div>

                {imageError && <p className="text-xs sm:text-[11px] text-(--danger) mb-2">{imageError}</p>}

                {imageUrls.length > 0 && (
                  <div className="mb-3 max-h-40 sm:max-h-32 overflow-y-auto pr-1">
                    <p className="text-xs sm:text-[10px] text-(--text-muted) mb-1.5 sticky top-0 bg-(--bg-elevated)">
                      {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""} staged — add more or insert
                    </p>
                    <div className="grid gap-1 rounded-lg overflow-hidden" style={{ gridTemplateColumns: `repeat(${Math.min(imageUrls.length, 3)}, 1fr)` }}>
                      {imageUrls.map((u, i) => (
                        <div key={i} className="relative group aspect-square bg-(--bg-page)">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={u} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 sm:w-4 sm:h-4 flex items-center justify-center rounded-full bg-black/70 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <X size={12} className="sm:hidden" />
                            <X size={9} className="hidden sm:block" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 sticky bottom-0 bg-(--bg-elevated) pt-2 pb-1 -mb-1">
                  {imageUrls.length > 0 ? (
                    <button type="button" onClick={handleInsertImages} className="flex-1 py-2.5 sm:py-1.5 bg-(--accent) hover:bg-(--accent-hover) text-white text-sm sm:text-xs rounded-lg sm:rounded transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]">
                      <ImagePlus size={14} /> Insert {imageUrls.length} image{imageUrls.length > 1 ? "s" : ""}
                    </button>
                  ) : (
                    <button type="button" onClick={handleAddImageUrl} disabled={imageLoading || !imageUrlInput.trim()} className="flex-1 py-2.5 sm:py-1.5 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 text-white text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]">
                      {imageLoading ? "Loading…" : "Add image"}
                    </button>
                  )}
                  <button type="button" onClick={resetImageState} className="px-4 sm:px-3 py-2.5 sm:py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]">
                    Cancel
                  </button>
                </div>

                <p className="text-xs sm:text-[10px] text-(--text-muted) mt-2 leading-relaxed">
                  Image URLs and device uploads add to a grid together.
                </p>
              </Popover>
            )}
          </div>

          {/* Video embed */}
          <div className="relative shrink-0">
            <ToolbarButton icon={<MonitorPlay size={13} />} label="Embed link" active={showEmbed} onClick={() => openOnly(setShowEmbed)} />
            {showEmbed && (
              <Popover onClose={resetEmbedState} title="Embed link" widthClass="sm:w-80">
                <div className="flex gap-1.5 mb-2">
                  <input
                    autoFocus
                    placeholder="Paste any link to embed…"
                    inputMode="url"
                    value={embedUrl}
                    onChange={(e) => { setEmbedUrl(e.target.value); setEmbedError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEmbed()}
                    className="flex-1 min-w-0 px-3 sm:px-2 py-2.5 sm:py-1.5 bg-(--bg-page) border border-(--border-soft) rounded-lg sm:rounded text-base sm:text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent)"
                  />
                </div>

                {embedError && <p className="text-xs sm:text-[11px] text-(--danger) mb-2">{embedError}</p>}

                <div className="flex gap-2 sticky bottom-0 bg-(--bg-elevated) pt-2 pb-1 -mb-1">
                  <button type="button" onClick={handleAddEmbed} disabled={!embedUrl.trim()} className="flex-1 py-2.5 sm:py-1.5 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 text-white text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]">
                    Insert
                  </button>
                  <button type="button" onClick={resetEmbedState} className="px-4 sm:px-3 py-2.5 sm:py-1.5 bg-(--bg-elevated) hover:bg-(--border-soft) text-(--text-primary) text-sm sm:text-xs rounded-lg sm:rounded transition-colors active:scale-[0.98]">
                    Cancel
                  </button>
                </div>
              </Popover>
            )}
          </div>

          {/* Emoji */}
          <div className="relative shrink-0">
            <ToolbarButton icon={<Smile size={13} />} label="Emoji" active={showEmoji} onClick={() => openOnly(setShowEmoji)} />
            {showEmoji && (
              <Popover onClose={() => setShowEmoji(false)} widthClass="sm:w-44">
                <div className="grid grid-cols-6 gap-1.5 sm:gap-0.5">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => { editor.chain().focus().insertContent(e).run(); setShowEmoji(false); }} className="w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center text-xl sm:text-base hover:bg-(--bg-elevated) active:bg-(--bg-page) rounded-lg sm:rounded transition-colors">
                      {e}
                    </button>
                  ))}
                </div>
              </Popover>
            )}
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* Preview toggle */}
          <ToolbarButton icon={preview ? <EyeOff size={13} /> : <Eye size={13} />} label={preview ? "Edit" : "Preview"} active={preview} onClick={onTogglePreview} />
        </div>

        {/* Mobile-only "more tools off screen" affordance */}
        {canScrollRight && (
          <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 flex items-center">
            <div className="w-10 h-full bg-linear-to-l from-(--bg-input) to-transparent" />
            <button
              type="button"
              aria-label="More tools"
              onClick={scrollToolbarRight}
              className="pointer-events-auto -ml-7 mr-1 w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-(--accent) text-white shadow-md active:scale-95 transition-transform"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {(showEmoji || showLink || showImage || showEmbed || showColor || showSize) && (
        <div className="fixed inset-0 z-40 bg-transparent sm:bg-transparent" onClick={closeAll} />
      )}
    </>
    
  );
}

export default RichEditorToolbar;