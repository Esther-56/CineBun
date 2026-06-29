/* eslint-disable react-hooks/refs */
"use client";

import { useState, useCallback } from "react";
import { Send, X } from "lucide-react";
import { useRichEditor } from "../../types/useRichEditor";
import { RichEditorToolbar } from "./RichEditorToolbar";

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
  initialContent,
  onSubmit,
  submitLabel = "Submit",
  onCancel,
  autoFocus = false,
  footerNote,
  height = "min-h-70",
  comment,
}: RichEditorProps) {
  const [preview, setPreview]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const editor = useRichEditor();

  // Set initialContent exactly once via a ref callback.
  // dangerouslySetInnerHTML on a contentEditable causes React to clobber the
  // DOM on every re-render, which resets selection and prevents typing.
  const editorRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      // Wire the editor hook's ref to the same DOM node
      (editor.editorRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (!node) return;
      if (initialContent) {
        node.innerHTML = initialContent;
      }
      if (autoFocus) {
        node.focus();
        // Move caret to end of content
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(node);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally empty — run once on mount only
  );

  const handleSubmit = async () => {
    setError("");
    const plainText = editor.editorRef.current?.innerText ?? "";
    if (!plainText.trim()) {
      setError("Content cannot be empty.");
      return;
    }
    setSubmitting(true);
    try {
      const html = editor.editorRef.current?.innerHTML ?? "";
      await onSubmit(html);
      editor.clear();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const safeUpdate = () => {
    requestAnimationFrame(() => {
      editor.updateToolbarState();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-[#3a1a1a] border border-[rgba(255,80,80,0.3)] text-[#ff6b6b] text-sm px-4 py-3 rounded-lg">
          <X size={14} />
          {error}
        </div>
      )}

      {/* Editor card */}
      <div className="bg-(--bg-surface) border border-(--border-soft) rounded-lg overflow-hidden">

        {/* Toolbar */}
        <RichEditorToolbar
          editorRef={editor.editorRef}
          formatState={editor.formatState}
          preview={preview}
          onTogglePreview={() => setPreview((v) => !v)}
          onExec={editor.exec}
          onInsertHeading={editor.insertHeading}
          onInsertHR={editor.insertHR}
          onInsertCode={editor.insertCode}
          onInsertQuote={editor.insertQuote}
          onInsertTable={editor.insertTable}
          onInsertEmoji={editor.insertEmoji}
          onInsertLink={editor.insertLink}
          onInsertVideoEmbed={editor.insertVideoEmbed}
          onInsertLinkCard={editor.insertLinkCard}
          onSaveSelection={editor.saveSelection}
        />

        {/* Preview pane */}
        <div
          className={`${preview ? "block" : "hidden"} ${height} px-4 py-3 text-(--text-primary) leading-relaxed overflow-auto prose-dark`}
          dangerouslySetInnerHTML={{
            __html:
              editor.editorRef.current?.innerHTML ||
              "<em class='text-(--text-muted)'>Nothing to preview yet.</em>",
          }}
        />

        {/* Editable area — uses ref callback, never dangerouslySetInnerHTML */}
        <div
          ref={editorRefCallback}
          contentEditable
          suppressContentEditableWarning
          onMouseUp={safeUpdate}
          onKeyUp={safeUpdate}
          onInput={() => {
            safeUpdate();
            editor.handleInput();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { /* toolbar handles its own state */ }
          }}
          data-placeholder={placeholder}
          className={`${height} ${preview ? "hidden" : "block"} px-4 py-3 text-(--text-primary) leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-(--text-muted) empty:before:pointer-events-none prose-dark`}
          style={{ fontFamily: "inherit", lineHeight: "1.7" }}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-(--border-soft) bg-(--bg-input)">
          <span className="text-[11px] text-(--text-muted)">{editor.getCharCount()} characters</span>
          {footerNote && (
            <span className="text-[11px] text-(--text-muted)">{footerNote}</span>
          )}
        </div>
      </div>

      {/* Actions */}
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