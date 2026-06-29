"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  alignLeft: boolean;
  alignCenter: boolean;
  alignRight: boolean;
  isCode: boolean;
  isQuote: boolean;
  heading: null | "h1" | "h2" | "h3" | "p";
}

const DEFAULT_FORMAT: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  orderedList: false,
  unorderedList: false,
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
  isCode: false,
  isQuote: false,
  heading: null,
};

export function useRichEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  // Stores a cloned snapshot of the last selection inside the editor.
  // Cloned so it survives the editor losing focus (e.g. when a toolbar
  // popover opens and steals focus away from the contentEditable).
  const savedRange = useRef<Range | null>(null);

  const [charCount, setCharCount] = useState(0);
  const [formatState, setFormatState] = useState<FormatState>(DEFAULT_FORMAT);

  // ── Selection helpers ──────────────────────────────────────────────────────

  /**
   * Snapshots the current selection IFF it lives inside the editor.
   * We deliberately ignore selections that land outside the editor (e.g. the
   * user clicking into a URL input in a toolbar popover) so we never clobber
   * a valid cursor position with a useless one.
   */
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
    savedRange.current = range.cloneRange();
  }, []);

  /**
   * Restores the saved selection into the live Selection object so that the
   * very next execCommand / insertHTML lands at the right position.
   * Must be called synchronously before execCommand — no setTimeout wrapper.
   */
  const restoreSelection = useCallback(() => {
    const range = savedRange.current;
    if (!range) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  // ── Toolbar state sync ─────────────────────────────────────────────────────

  const updateToolbarState = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const anchorNode = selection.anchorNode as HTMLElement | null;
    const parent =
      anchorNode?.nodeType === 3
        ? anchorNode.parentElement
        : (anchorNode as HTMLElement);

    const tagName = parent?.tagName?.toLowerCase();

    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      alignLeft: document.queryCommandState("justifyLeft"),
      alignCenter: document.queryCommandState("justifyCenter"),
      alignRight: document.queryCommandState("justifyRight"),
      isCode: tagName === "code" || !!parent?.closest("pre"),
      isQuote: tagName === "blockquote" || !!parent?.closest("blockquote"),
      heading:
        tagName === "h1" ? "h1"
        : tagName === "h2" ? "h2"
        : tagName === "h3" ? "h3"
        : tagName === "p"  ? "p"
        : null,
    });
  }, []);

  // ── Input handler ──────────────────────────────────────────────────────────

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    setCharCount(el.innerText.length);
  }, []);

  // ── Core exec ─────────────────────────────────────────────────────────────

  /**
   * All formatting commands go through here.
   * 1. Focus the editor (required for execCommand to target it).
   * 2. Restore the saved selection synchronously — no setTimeout so the range
   *    is still live when execCommand reads it.
   * 3. Run the command.
   */
  const exec = useCallback(
    (cmd: string, value?: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();
      document.execCommand(cmd, false, value);
      updateToolbarState();
      handleInput();
    },
    [restoreSelection, updateToolbarState, handleInput],
  );

  // ── Global selection listener ─────────────────────────────────────────────

  useEffect(() => {
    document.addEventListener("selectionchange", saveSelection);
    return () => document.removeEventListener("selectionchange", saveSelection);
  }, [saveSelection]);

  // ── Utility ───────────────────────────────────────────────────────────────

  const getCharCount = useCallback(
    () => editorRef.current?.innerText.length ?? 0,
    [],
  );

  const clear = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = "";
    savedRange.current = null;
    setCharCount(0);
    setFormatState(DEFAULT_FORMAT);
  }, []);

  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest("a");
    if (!link) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      window.open(link.href, "_blank", "noopener,noreferrer");
    }
  }, []);

  // ── Block inserts ──────────────────────────────────────────────────────────

  const insertHeading = useCallback(
    (tag: string) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();
      document.execCommand("formatBlock", false, `<${tag}>`);
      updateToolbarState();
      handleInput();
    },
    [restoreSelection, updateToolbarState, handleInput],
  );

  const insertHR = useCallback(() => {
    exec(
      "insertHTML",
      '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:12px 0"/><p><br></p>',
    );
  }, [exec]);

  const insertCode = useCallback(() => {
    const text = window.getSelection()?.toString() || "code here";
    exec(
      "insertHTML",
      `<pre style="background:#1b1c1f;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:12px;font-family:monospace;font-size:13px;white-space:pre-wrap;color:#e4e6eb">${text}</pre><p><br></p>`,
    );
  }, [exec]);

  const insertQuote = useCallback(() => {
    const text = window.getSelection()?.toString() || "Quote text here";
    exec(
      "insertHTML",
      `<blockquote style="border-left:3px solid #1877f2;margin:8px 0;padding:8px 12px;background:rgba(24,119,242,0.08);color:#9fa3aa;border-radius:0 4px 4px 0">${text}</blockquote><p><br></p>`,
    );
  }, [exec]);

  const insertTable = useCallback(() => {
    exec(
      "insertHTML",
      `<table style="border-collapse:collapse;width:100%;margin:8px 0">
        <thead><tr>
          <th style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px;background:rgba(255,255,255,0.05);text-align:left">Header 1</th>
          <th style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px;background:rgba(255,255,255,0.05);text-align:left">Header 2</th>
          <th style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px;background:rgba(255,255,255,0.05);text-align:left">Header 3</th>
        </tr></thead>
        <tbody><tr>
          <td style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px">Cell</td>
          <td style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px">Cell</td>
          <td style="border:1px solid rgba(255,255,255,0.1);padding:8px 12px">Cell</td>
        </tr></tbody>
      </table><p><br></p>`,
    );
  }, [exec]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      restoreSelection();
      exec("insertText", emoji);
    },
    [restoreSelection, exec],
  );

  const insertLink = useCallback(
    (url: string, displayText?: string) => {
      restoreSelection();
      const display = displayText?.trim() || url;
      exec(
        "insertHTML",
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${display}</a>`,
      );
    },
    [restoreSelection, exec],
  );

  const insertVideoEmbed = useCallback(
    (src: string) => {
      exec(
        "insertHTML",
        `<div contenteditable="false" style="position:relative;max-width:560px;aspect-ratio:16/9;margin:10px 0;border-radius:8px;overflow:hidden;background:#000">` +
          `<iframe src="${src}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>` +
          `</div><p><br></p>`,
      );
    },
    [exec],
  );

  const insertLinkCard = useCallback(
    (meta: {
      url: string;
      title: string;
      description: string;
      image: string;
      siteName: string;
    }) => {
      exec(
        "insertHTML",
        `<a href="${meta.url}" target="_blank" rel="noopener noreferrer" contenteditable="false" style="display:flex;margin:10px 0;border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;background:#1b1c1f;text-decoration:none;max-width:560px">` +
          (meta.image
            ? `<div style="width:120px;flex-shrink:0;background-image:url('${meta.image}');background-size:cover;background-position:center"></div>`
            : "") +
          `<div style="padding:10px 12px;min-width:0;flex:1">` +
          `<p style="color:#8a8d91;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 4px">${meta.siteName}</p>` +
          `<p style="color:#e4e6eb;font-size:13px;font-weight:600;margin:0 0 4px;line-height:1.3">${meta.title}</p>` +
          (meta.description
            ? `<p style="color:#9fa3aa;font-size:12px;margin:0;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${meta.description}</p>`
            : "") +
          `</div>` +
          `</a><p><br></p>`,
      );
    },
    [exec],
  );

  return {
    editorRef,
    savedRange,
    charCount,
    formatState,
    getCharCount,
    exec,
    saveSelection,
    restoreSelection,
    updateToolbarState,
    handleInput,
    handleEditorClick,
    insertHeading,
    insertHR,
    insertCode,
    insertQuote,
    insertTable,
    insertEmoji,
    insertLink,
    insertVideoEmbed,
    insertLinkCard,
    clear,
  };
}