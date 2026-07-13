"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { X, Image as ImageIcon, AlertCircle, ChevronDown, Loader2, Upload, BarChart3, Plus } from "lucide-react";
import { ThreadService } from "@/app/services/threads";
import { RichEditor } from "@/app/MainPage/trendingThreads/threadcomponent/RichEditor";
import { useRouter } from "nextjs-toploader/app";

const MAX_TAGS = 5;
const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB, matches /api/upload server-side cap

const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 6;
const POLL_DURATIONS = [
  { value: "1",  label: "1 day" },
  { value: "3",  label: "3 days" },
  { value: "7",  label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "0",  label: "No end date" },
];

const PREFIXES = [
  { value: "Discussion", color: "#1877f2", desc: "General conversation" },
  { value: "Question",   color: "#e69c00", desc: "Seeking help or answers" },
  { value: "Guide",      color: "#1ca35e", desc: "Tutorial or how-to" },
  { value: "News",       color: "#c43f3f", desc: "Announcements & updates" },
  { value: "Poll",       color: "#9b5de5", desc: "Community vote" },
];

interface PollOption {
  id: string;
  text: string;
}

export default function NewThreadPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const subforumId   = searchParams.get("subforumId") ?? "";
  const categoryId   = searchParams.get("categoryId") ?? undefined;
  const subforumName = searchParams.get("subforumName") ?? "Unknown Forum";

  const [title, setTitle]           = useState("");
  const [prefix, setPrefix]         = useState("");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [tags, setTags]             = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState("");
  const [image, setImage]           = useState("");
  const [imageError, setImageError] = useState("");
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState("");

  // ── Poll ──────────────────────────────────────────────────────────────────
  const [showPoll, setShowPoll]         = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions]   = useState<PollOption[]>([
    { id: "opt-1", text: "" },
    { id: "opt-2", text: "" },
  ]);
  const [pollDuration, setPollDuration] = useState("3");
  const [pollError, setPollError]       = useState("");
  const pollIdCounter = useRef(2);

  const prefixRef     = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prefixRef.current && !prefixRef.current.contains(e.target as Node)) {
        setPrefixOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addTag = (raw: string) => {
    const value = raw.trim().replace(/,$/, "");
    if (!value) return;
    if (tags.length >= MAX_TAGS) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((t) => t !== value));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("File too large. Max 1MB.");
      return;
    }

    setImageError("");
    setUploading(true);
    try {
      const url = await ThreadService.uploadImage(file);
      setImage(url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Poll helpers ──────────────────────────────────────────────────────────

  const togglePoll = () => {
    setShowPoll(true);
    setPrefix((prev) => prev || "Poll");
  };

  const resetPoll = () => {
    setShowPoll(false);
    setPollQuestion("");
    setPollOptions([
      { id: "opt-1", text: "" },
      { id: "opt-2", text: "" },
    ]);
    setPollDuration("3");
    setPollError("");
    pollIdCounter.current = 2;
  };

  const updatePollQuestion = (value: string) => {
    setPollQuestion(value);
    if (pollError) setPollError("");
  };

  const updatePollOption = (id: string, text: string) => {
    setPollOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
    if (pollError) setPollError("");
  };

  const addPollOption = () => {
    if (pollOptions.length >= MAX_POLL_OPTIONS) return;
    pollIdCounter.current += 1;
    setPollOptions((prev) => [...prev, { id: `opt-${pollIdCounter.current}`, text: "" }]);
  };

  const removePollOption = (id: string) => {
    setPollOptions((prev) => (prev.length > MIN_POLL_OPTIONS ? prev.filter((o) => o.id !== id) : prev));
  };

const handleSubmit = async (html: string) => {
  setError("");
  setPollError("");
  if (!title.trim()) { setError("Please enter a title."); return; }
  if (!subforumId)   { setError("No subforum selected."); return; }

  let poll: { question: string; options: string[]; durationDays: number } | undefined;
  if (showPoll) {
    const question = pollQuestion.trim();
    const options = pollOptions.map((o) => o.text.trim()).filter(Boolean);
    const pollIsEmpty = !question && options.length === 0;

    if (!pollIsEmpty) {
      if (!question) { setPollError("Add a question for your poll."); return; }
      if (options.length < MIN_POLL_OPTIONS) { setPollError(`Add at least ${MIN_POLL_OPTIONS} options.`); return; }
      poll = { question, options, durationDays: Number(pollDuration) };
    }
    // else: poll UI is open but untouched — treat as "no poll", no error, nothing sent.
  }

  const { data, success } = await ThreadService.create({
    title: title.trim(),
    content: html,
    image: image.trim(),
    tags,
    prefix: prefix || undefined,
    subforumId,
    categoryId,
    poll,
  });
  const id = data?.thread?._id;

  if (success) {
    const params = new URLSearchParams({ page: "1" });
    router.replace(`/f/${subforumId}/${id}?${params.toString()}`);
  }
};

  const selectedPrefix = PREFIXES.find((p) => p.value === prefix);

  return (
    <div className="min-h-screen bg-(--bg-page) text-(--text-primary)">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="flex font-medium items-center gap-2 text-sm text-(--text-muted) mb-5">
          <button onClick={() => router.back()} className="hover:text-(--text-primary) transition-colors">
            Forums
          </button>
          <span>/</span>
          <span className="text-(--text-primary)">{subforumName}</span>
          <span>/</span>
          <span className="text-(--accent)">New Thread</span>
        </div>

        <h1 className="text-xl font-bold text-(--text-primary) mb-5">Post New Thread</h1>

        {/* Page-level error */}
        {error && (
          <div className="flex items-center gap-2 bg-[#3a1a1a] border border-[rgba(255,80,80,0.3)] text-[#ff6b6b] text-sm px-4 py-3 rounded-lg mb-4">
            <X size={14} />
            {error}
          </div>
        )}

        <div className="space-y-3">

          {/* Title */}
          <input
            type="text"
            placeholder="Thread title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full font-medium h-10 px-3 bg-(--bg-surface) border border-(--border-soft) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors"
          />

          {/* Prefix dropdown */}
          <div className="relative font-medium" ref={prefixRef}>
            <button
              type="button"
              onClick={() => setPrefixOpen((o) => !o)}
              className={`flex items-center gap-2 w-full h-10 px-3 bg-(--bg-surface) border rounded-lg text-sm transition-colors ${
                prefixOpen
                  ? "border-(--accent)"
                  : "border-(--border-soft) hover:border-(--border-medium)"
              }`}
              aria-haspopup="listbox"
              aria-expanded={prefixOpen}
            >
              {selectedPrefix && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: selectedPrefix.color }}
                />
              )}

              <span className={`flex-1 text-left ${!prefix ? "text-(--text-muted)" : "text-(--text-primary)"}`}>
                {prefix || "Select a prefix… (optional)"}
              </span>

              {prefix && (
                <span
                  role="button"
                  aria-label="Clear prefix"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPrefix("");
                  }}
                  className="flex items-center font-medium justify-center w-4 h-4 rounded hover:bg-white/10 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  <X size={10} />
                </span>
              )}

              <ChevronDown
                size={14}
                className={`text-(--text-muted) transition-transform duration-150 ${prefixOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {prefixOpen && (
              <div
                className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-(--bg-elevated) border border-(--border-medium) rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                role="listbox"
              >
                <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-(--text-muted) font-medium">
                  Thread prefix
                </div>

                {/* No prefix option */}
                <button
                  type="button"
                  role="option"
                  aria-selected={prefix === ""}
                  onClick={() => { setPrefix(""); setPrefixOpen(false); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors ${
                    prefix === ""
                      ? "bg-(--accent-subtle) text-(--accent)"
                      : "text-(--text-muted) hover:bg-white/5"
                  }`}
                >
                  No prefix
                </button>

                {PREFIXES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="option"
                    aria-selected={prefix === p.value}
                    onClick={() => { setPrefix(p.value); setPrefixOpen(false); }}
                    className={`flex items-center gap-2.5 font-medium w-full px-3 py-2.5 text-sm transition-colors ${
                      prefix === p.value
                        ? "bg-(--accent-subtle) text-(--accent)"
                        : "text-(--text-primary) hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: p.color }}
                    />
                    <span className="flex-1 text-left">{p.value}</span>
                    <span className="text-xs text-(--text-muted)">{p.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap font-medium items-center gap-1.5 min-h-10 px-3 py-1.5 bg-(--bg-surface) border border-(--border-soft) rounded-lg focus-within:border-(--accent) transition-colors">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-(--accent-subtle) text-(--accent) text-xs font-medium pl-2 pr-1 py-1 rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-(--accent-subtle) rounded p-0.5 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => addTag(tagInput)}
                placeholder={tags.length ? "" : "Add tags… (press Enter)"}
                disabled={tags.length >= MAX_TAGS}
                className="flex-1 min-w-25 font-medium bg-transparent text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
            <span className="text-[11px] text-(--text-muted)">
              {tags.length}/{MAX_TAGS} tags · press Enter or comma to add
            </span>
          </div>

          {/* Image — paste a link, or upload from device */}
          <div className="flex font-medium flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 h-10 px-3 bg-(--bg-surface) border border-(--border-soft) rounded-lg focus-within:border-(--accent) transition-colors">
                <ImageIcon size={14} className="text-(--text-muted) shrink-0" />
                <input
                  type="url"
                  placeholder="Image link…"
                  value={image}
                  onChange={(e) => {
                    setImage(e.target.value);
                    if (imageError) setImageError("");
                  }}
                  className="flex-1 bg-transparent font-medium text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelected}
              />
              <button
                type="button"
                onClick={handleFilePick}
                disabled={uploading}
                className="shrink-0 flex items-center gap-1.5 h-10 px-3 bg-(--bg-elevated) hover:bg-(--border-soft) disabled:opacity-50 text-(--text-primary) text-xs font-medium rounded-lg transition-colors"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>

            {imageError && (
              <span className="flex items-center gap-1 text-[#ff6b6b] text-xs">
                <AlertCircle size={12} />
                {imageError}
              </span>
            )}
            {image && !imageError && (
              <div className="rounded-lg overflow-hidden border border-(--border-soft) max-h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Thread preview"
                  className="w-full h-40 object-cover"
                  onError={() => setImageError("This image link couldn't be loaded.")}
                />
              </div>
            )}
          </div>

          {/* Poll */}
          <div className="flex flex-col gap-1">
            {!showPoll ? (
              <button
                type="button"
                onClick={togglePoll}
                className="flex items-center gap-2 w-full h-10 px-3 bg-(--bg-surface) border border-dashed border-(--border-medium) hover:border-(--accent) rounded-lg text-sm font-medium text-(--text-muted) hover:text-(--text-primary) transition-colors"
              >
                <BarChart3 size={14} />
                Add a poll
              </button>
            ) : (
              <div className="bg-(--bg-surface) border border-(--border-soft) rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
                    <BarChart3 size={12} /> Poll
                  </span>
                  <button
                    type="button"
                    onClick={resetPoll}
                    className="flex items-center gap-1 text-xs font-medium text-(--text-muted) hover:text-[#ff6b6b] transition-colors"
                  >
                    <X size={12} /> Remove poll
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ask a question…"
                  value={pollQuestion}
                  onChange={(e) => updatePollQuestion(e.target.value)}
                  maxLength={200}
                  className="w-full font-medium h-10 px-3 bg-(--bg-page) border border-(--border-soft) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--accent) transition-colors"
                />

                <div className="flex flex-col gap-1.5">
                  {pollOptions.map((opt, i) => (
                    <div key={opt.id} className="flex items-center gap-1.5">
                      <span className="w-5 shrink-0 text-xs text-(--text-muted) text-center">{i + 1}</span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updatePollOption(opt.id, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        maxLength={80}
                        className="flex-1 h-9 px-3 bg-(--bg-page) border border-(--border-soft) rounded-lg text-sm font-medium text-(--text-primary) placeholder:text-(--text-muted) placeholder:font-normal focus:outline-none focus:border-(--accent) transition-colors"
                      />
                      {pollOptions.length > MIN_POLL_OPTIONS && (
                        <button
                          type="button"
                          onClick={() => removePollOption(opt.id)}
                          aria-label={`Remove option ${i + 1}`}
                          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-[#ff6b6b] hover:bg-(--bg-page) transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < MAX_POLL_OPTIONS && (
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="flex items-center gap-1.5 text-xs font-semibold text-(--accent) hover:text-(--accent-hover) transition-colors"
                  >
                    <Plus size={13} /> Add option
                  </button>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-medium text-(--text-muted) shrink-0">Voting ends in</span>
                  <div className="relative">
                    <select
                      value={pollDuration}
                      onChange={(e) => setPollDuration(e.target.value)}
                      className="h-9 pl-3 pr-8 bg-(--bg-page) border border-(--border-soft) rounded-lg text-xs font-medium text-(--text-primary) focus:outline-none focus:border-(--accent) appearance-none cursor-pointer"
                    >
                      {POLL_DURATIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                  </div>
                </div>

                {pollError && (
                  <span className="flex items-center gap-1 text-[#ff6b6b] text-xs font-medium">
                    <AlertCircle size={12} />
                    {pollError}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rich editor */}
          <RichEditor
            placeholder="Write your thread content here…"
            submitLabel="Post Thread"
            footerNote={`Posting in ${subforumName}`}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            autoFocus
          />

        </div>
      </div>
    </div>
  );
}