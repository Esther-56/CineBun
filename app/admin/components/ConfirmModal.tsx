'use client';
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  title, description, confirmLabel, danger = true, requireReason = false,
  requireHours = false, onConfirm, onClose,loading
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  requireReason?: boolean;
  requireHours?: boolean;
  onConfirm: (reason: string, hours?: number) => void;
  onClose: () => void;
  loading : boolean
}) {
  const [reason, setReason] = useState('');
  const [hours, setHours] = useState('');

  const canConfirm =
    (!requireReason || reason.trim().length > 0) &&
    (!requireHours || (Number(hours) > 0 && Number.isFinite(Number(hours))));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#242528] border border-[rgba(255,255,255,0.08)] rounded-lg w-full max-w-sm p-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0
              ${danger ? 'bg-[#ef4444]/15 text-[#ef4444]' : 'bg-[#4b8ef1]/15 text-[#4b8ef1]'}`}>
              <AlertTriangle size={13} />
            </div>
            <h3 className="text-xs font-bold text-[#e4e6eb]">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#4a4b50] hover:text-[#8a8d91] transition-colors">
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-[#8a8d91] mb-3">{description}</p>

        {requireHours && (
          <div className="mb-3">
            <label className="text-[10px] font-bold text-[#4a4b50] uppercase tracking-widest mb-1 block">
              Duration (hours)
            </label>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="e.g. 24"
              className="w-full bg-[#1b1c1f] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 text-xs text-[#e4e6eb] placeholder:text-[#4a4b50] outline-none focus:border-[#4b8ef1] transition-colors"
            />
          </div>
        )}

        {requireReason && (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason (visible to the user)"
            rows={2}
            className="w-full bg-[#1b1c1f] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 text-xs text-[#e4e6eb] placeholder:text-[#4a4b50] outline-none focus:border-[#4b8ef1] transition-colors resize-none mb-3"
          />
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#2d2e32] hover:bg-[#363739] text-[#8a8d91] text-xs font-medium rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => canConfirm && onConfirm(reason.trim(), requireHours ? Number(hours) : undefined)}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-40
              ${danger ? 'bg-[#ef4444] hover:bg-[#dc3636] text-white' : 'bg-[#4b8ef1] hover:bg-[#3a7de0] text-white'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}