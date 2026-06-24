'use client';
import { useState } from 'react';

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  J: '#10b981', A: '#ef4444', R: '#4b8ef1',
  T: '#8b5cf6', N: '#f59e0b', C: '#ec4899',
};

interface AvatarProps {
  letter: string;
  size?: number;
  className?: string;
}

export function Avatar({ letter, size = 80, className = '' }: AvatarProps) {
  const bg = AVATAR_COLORS[letter] ?? '#4b8ef1';
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 border-4 border-[#1b1c1f] shadow-xl ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.38 }}
    >
      {letter}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
interface ToggleProps {
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
}

export function Toggle({ defaultChecked = false, onChange }: ToggleProps) {
  const [on, setOn] = useState(defaultChecked);
  const handleClick = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };
  return (
    <button
      onClick={handleClick}
      aria-checked={on}
      role="switch"
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? 'bg-(--accent)' : 'bg-(--bg-elevated)'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  rows?: number;
  disabled?: boolean;
}

export function Field({
  label, value, defaultValue = '', placeholder = '',
  type = 'text', multiline = false, hint, icon, rows = 3,
  onChange, disabled = false,
}: FieldProps) {
  const isControlled = value !== undefined;

  return (
    <div>
      <label className="block text-xs font-semibold text-(--text-secondary) mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-muted)">{icon}</div>
        )}
        {multiline ? (
          <textarea
            value={isControlled ? value : undefined}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className="w-full bg-(--bg-page) border border-(--border-medium) rounded-md px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors resize-none disabled:opacity-50"
          />
        ) : (
          <input
            type={type}
            value={isControlled ? value : undefined}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full bg-(--bg-page) border border-(--border-medium) rounded-md py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--accent) transition-colors ${icon ? 'pl-8 pr-3' : 'px-3'} disabled:opacity-50`}
          />
        )}
      </div>
      {hint && <p className="text-[11px] text-(--text-muted) mt-1">{hint}</p>}
    </div>
  );
}

// ── StatPill ──────────────────────────────────────────────────────────────────
interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 bg-(--bg-surface) rounded-lg border border-(--border-soft)">
      <div className="text-(--accent) mb-1">{icon}</div>
      <div className="text-(--text-primary) font-bold text-base leading-none mb-1">{value}</div>
      <div className="text-(--text-secondary) text-[12px] uppercase tracking-wide">{label}</div>
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  headerExtra?: React.ReactNode;
}

export function SectionCard({ title, children, danger = false, headerExtra }: SectionCardProps) {
  return (
    <div className={`bg-(--bg-surface) rounded-lg border ${danger ? 'border-(--danger)/20' : 'border-(--border-soft)'}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${danger ? 'border-(--danger)/20' : 'border-(--border-soft)'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-widest ${danger ? 'text-(--danger)' : 'text-(--text-primary)'}`}>
          {title}
        </h2>
        {headerExtra && <div className="ml-auto">{headerExtra}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2.5 py-1.5 text-xs text-(--text-muted) hover:text-(--text-primary) disabled:opacity-30 disabled:cursor-not-allowed hover:bg-(--bg-elevated) rounded transition-colors"
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-(--text-muted) text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={`w-7 h-7 text-xs rounded transition-colors ${currentPage === p ? 'bg-(--accent) text-white font-semibold' : 'text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-elevated)'}`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2.5 py-1.5 text-xs text-(--text-muted) hover:text-(--text-primary) disabled:opacity-30 disabled:cursor-not-allowed hover:bg-(--bg-elevated) rounded transition-colors"
      >
        Next →
      </button>
    </div>
  );
}