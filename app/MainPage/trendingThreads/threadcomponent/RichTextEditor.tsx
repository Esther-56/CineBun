"use client";
import { useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Link2, Image as ImageIcon,
  Quote, Code, List, ListOrdered, Smile,
} from 'lucide-react';

interface ToolbarButtonProps {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  active?: boolean;
}

function ToolbarButton({ onClick, label, children, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()} // keep selection alive when clicking
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-[#4b8ef1] text-white' : 'text-[#8a8d91] hover:bg-[#2d2e32] hover:text-[#e4e6eb]'
      }`}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  placeholder?: string;
  initialContent?: string;
  onSubmit: (html: string) => void;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function RichTextEditor({
  placeholder = 'Write a reply...',
  initialContent = '',
  onSubmit,
  submitLabel = 'Post Reply',
  onCancel,
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(initialContent.trim().length === 0);

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncEmptyState();
  }

  function syncEmptyState() {
    const text = editorRef.current?.innerText.trim() ?? '';
    setIsEmpty(text.length === 0);
  }

  function handleInsertLink() {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  }

  function handleInsertEmbed() {
    const url = window.prompt('Paste a link to embed (image, video, or page URL)');
    if (!url) return;
    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url);
    const html = isImage
      ? `<img src="${url}" alt="" style="max-width:100%;border-radius:8px;margin:6px 0;" />`
      : `<a href="${url}" target="_blank" rel="noopener noreferrer" class="embed-link">${url}</a>`;
    document.execCommand('insertHTML', false, html);
    editorRef.current?.focus();
    syncEmptyState();
  }

  function handleSubmit() {
    const html = editorRef.current?.innerHTML ?? '';
    if (!html || isEmpty) return;
    onSubmit(html);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setIsEmpty(true);
  }

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1e1f23] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(255,255,255,0.06)] bg-[#1b1c1f] flex-wrap">
        <ToolbarButton label="Bold" onClick={() => exec('bold')}><Bold size={14} /></ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec('italic')}><Italic size={14} /></ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec('underline')}><Underline size={14} /></ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => exec('strikeThrough')}><Strikethrough size={14} /></ToolbarButton>
        <div className="w-px h-5 bg-[rgba(255,255,255,0.08)] mx-1" />
        <ToolbarButton label="Bulleted list" onClick={() => exec('insertUnorderedList')}><List size={14} /></ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered size={14} /></ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => exec('formatBlock', '<blockquote>')}><Quote size={14} /></ToolbarButton>
        <ToolbarButton label="Code" onClick={() => exec('formatBlock', '<pre>')}><Code size={14} /></ToolbarButton>
        <div className="w-px h-5 bg-[rgba(255,255,255,0.08)] mx-1" />
        <ToolbarButton label="Insert link" onClick={handleInsertLink}><Link2 size={14} /></ToolbarButton>
        <ToolbarButton label="Embed image or link" onClick={handleInsertEmbed}><ImageIcon size={14} /></ToolbarButton>
        <ToolbarButton label="Insert emoji" onClick={() => exec('insertText', '🙂')}><Smile size={14} /></ToolbarButton>
      </div>

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          autoFocus={autoFocus}
          onInput={syncEmptyState}
          dangerouslySetInnerHTML={{ __html: initialContent }}
          className="min-h-27.5 max-h-80 overflow-y-auto px-3.5 py-3 text-sm text-[#e4e6eb] outline-none rich-text-editor"
          suppressContentEditableWarning
        />
        {isEmpty && (
          <span className="absolute left-3.5 top-3 text-sm text-[#4a4b50] pointer-events-none">
            {placeholder}
          </span>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-[rgba(255,255,255,0.06)] bg-[#1b1c1f]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-[#8a8d91] hover:text-[#e4e6eb] rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isEmpty}
          className="px-3.5 py-1.5 bg-[#4b8ef1] hover:bg-[#3a7de0] disabled:bg-[#2d2e32] disabled:text-[#4a4b50] disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
        >
          {submitLabel}
        </button>
      </div>

      <style jsx global>{`
        .rich-text-editor blockquote {
          border-left: 3px solid #4b8ef1;
          padding: 6px 10px;
          margin: 6px 0;
          background: rgba(75, 142, 241, 0.08);
          border-radius: 4px;
          color: #a8b3cf;
        }
        .rich-text-editor pre {
          background: #141517;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          padding: 8px 10px;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          overflow-x: auto;
          margin: 6px 0;
        }
        .rich-text-editor a, .embed-link {
          color: #4b8ef1;
          text-decoration: underline;
        }
        .rich-text-editor ul, .rich-text-editor ol {
          padding-left: 1.4em;
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}