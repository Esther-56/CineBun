// app/admin/components/BadgeForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';
import IconPicker from './IconPicker';
import type { Badge } from '@/app/services/badges';

interface BadgeFormProps {
  mode: 'create' | 'edit';
  initial?: Badge;
  onSubmit: (data: Omit<Badge, '_id' | 'isDefault'>) => Promise<void>;
  onCancel?: () => void;
}

const TIERS = ['bronze', 'silver', 'gold', 'special'] as const;

function slugify(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export default function BadgeForm({ mode, initial, onSubmit, onCancel }: BadgeFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [key, setKey] = useState(initial?.key ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'Award');
  const [color, setColor] = useState(initial?.color ?? '#4b8ef1');
  const [tier, setTier] = useState<typeof TIERS[number]>(initial?.tier ?? 'bronze');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (mode === 'create') setKey(slugify(val)); // key only auto-derives on creation
  };

  useEffect(() => {
  if (!initial) return;

  setLabel(initial.label);
  setKey(initial.key);
  setDescription(initial.description);
  setIcon(initial.icon);
  setColor(initial.color);
  setTier(initial.tier as typeof TIERS[number]);
}, [initial]);


  const handleSubmit = async () => {
    if (!label.trim() || !key.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ key, label, description, icon, color, tier });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#242528] rounded-lg border border-[rgba(255,255,255,0.06)] p-4 flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <IconPicker value={icon} color={color} onChange={setIcon} />
        <div className="flex-1 flex flex-col gap-1.5">
          <input
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="Badge name"
            className="bg-[#1b1c1f] text-sm text-[#e4e6eb] rounded-md px-2.5 py-1.5 border border-[rgba(255,255,255,0.08)] focus:border-[#4b8ef1]/50 outline-none"
          />
          <p className="text-[10px] text-[#4a4b50]">
            key: <span className="text-[#6b6d72]">{key || '—'}</span>
            {mode === 'edit' && ' (locked after creation)'}
          </p>
        </div>
      </div>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Short description shown on hover"
        rows={2}
        className="bg-[#1b1c1f] text-xs text-[#e4e6eb] rounded-md px-2.5 py-2 border border-[rgba(255,255,255,0.08)] focus:border-[#4b8ef1]/50 outline-none resize-none"
      />

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[#4a4b50] uppercase tracking-wide">Color</label>
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-9 h-9 rounded-md cursor-pointer bg-transparent border-0"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] text-[#4a4b50] uppercase tracking-wide">Tier</label>
          <select
            value={tier}
            onChange={e => setTier(e.target.value as typeof tier)}
            className="bg-[#1b1c1f] text-xs text-[#e4e6eb] rounded-md px-2.5 py-2 border border-[rgba(255,255,255,0.08)] outline-none"
          >
            {TIERS.map(t => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !label.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-60
            ${saved ? 'bg-[#10b981] text-white' : 'bg-[#4b8ef1] hover:bg-[#3a7de0] text-white'}`}
        >
          {saving
            ? <><Loader2 size={11} className="animate-spin" /> Saving</>
            : saved
              ? <><Check size={11} /> Saved</>
              : <><Save size={11} /> {mode === 'create' ? 'Create badge' : 'Save changes'}</>}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-[11px] text-[#8a8d91] hover:text-[#e4e6eb] px-2.5 py-1.5">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}