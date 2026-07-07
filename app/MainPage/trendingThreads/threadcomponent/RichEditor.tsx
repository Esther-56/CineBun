"use client";

import { useState } from "react";
import { Send, X } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { MentionSuggestion } from "@/app/components/editor/extensions/MentionSuggestion";
import { highlightMentions } from "@/app/lib/helpers/highlightMentions";
import { FontSize } from "@/app/components/editor/extensions/FontSize";
import { VideoEmbed } from "@/app/components/editor/extensions/VideoEmbed";
import { ImageGrid } from "@/app/components/editor/extensions/ImageGrid";
import { LinkCard } from "@/app/components/editor/extensions/LinkCard";
import { RichEditorToolbar } from "@/app/components/editor/RichEditorToolbar";

export interface RichEditorProps {
  placeholder?: string;
  initialContent?: string;
  onSubmit: (html: string) => void | Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  footerNote?: string;
  height?: string;
  comment?: boolean;
}

export function RichEditor({
  placeholder = "Write something…",
  initialContent = "",
  onSubmit,
  submitLabel = "Submit",
  onCancel,
  autoFocus = false,
  footerNote,
  height = "min-h-70",
  comment,
}: RichEditorProps) {
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // horizontalRule / codeBlock / blockquote / lists all come from StarterKit
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ HTMLAttributes: { class: "editor-image" } }),
      ImageGrid,
      VideoEmbed,
      LinkCard,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      MentionSuggestion,
    ],
    editorProps: {
      attributes: {
        class: `prose-dark focus:outline-none px-4 py-3 leading-relaxed ${height} overflow-auto`,
        style: "font-family: inherit; line-height: 1.7;",
      },
    },
  });

  const handleSubmit = async () => {
    setError("");
    if (!editor) return;
    const plainText = editor.getText().trim();
    if (!plainText) {
      setError("Content cannot be empty.");
      return;
    }
    setSubmitting(true);
    try {
      const html = editor.getHTML();
      await onSubmit(html);
      editor.commands.clearContent(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const rawHtml = editor?.getHTML() ?? "";
  const hasPreviewContent = rawHtml.trim() && rawHtml !== "<p></p>";

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-center gap-2 bg-[#3a1a1a] border border-[rgba(255,80,80,0.3)] text-[#ff6b6b] text-sm px-4 py-3 rounded-lg">
          <X size={14} />
          {error}
        </div>
      )}

      <div className="bg-(--bg-surface) border border-(--border-soft) rounded-lg overflow-hidden">
        {editor && (
          <RichEditorToolbar editor={editor} preview={preview} onTogglePreview={() => setPreview((v) => !v)} />
        )}

        {/* Preview pane */}
        <div
          className={`${preview ? "block" : "hidden"} ${height} px-4 py-3 text-(--text-primary) leading-relaxed overflow-auto prose-dark`}
          dangerouslySetInnerHTML={{
            __html: hasPreviewContent
              ? highlightMentions(rawHtml)
              : "<em class='text-(--text-muted)'>Nothing to preview yet.</em>",
          }}
        />

        {/* Editable area */}
        <div className={preview ? "hidden" : "block"}>
          <EditorContent editor={editor} />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-(--border-soft) bg-(--bg-input)">
          <span className="text-[11px] text-(--text-muted)">
            {editor?.storage.characterCount.characters() ?? 0} characters
          </span>
          {footerNote && <span className="text-[11px] text-(--text-muted)">{footerNote}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            Cancel
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex items-center gap-2 ${comment ? "px-2" : "px-5"} py-2 bg-(--accent) hover:bg-(--accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors`}
        >
          <Send size={14} />
          {submitting ? "Submitting…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

export default RichEditor;