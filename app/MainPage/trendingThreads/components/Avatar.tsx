'use client';
import { useState } from 'react';
import { avatarColors } from '../../Interfaces/lib/utils';
import { useRouter } from 'nextjs-toploader/app';

export type AvatarEffectKey =
  | 'pulse-blue'
  | 'pulse-gold'
  | 'fire-ring'
  | 'rainbow-ring'
  | 'elite'
  | 'aura-green'
  | 'aura-pink'
  | 'ice-ring'
  | 'lightning-ring'
  | 'void'
  | 'crimson'
  | 'celestial'
  | 'toxic'
  | 'galaxy'
  | null
  | undefined;

export const AVATAR_EFFECTS: { id: AvatarEffectKey; label: string }[] = [
  { id: null,            label: 'None' },
  { id: 'pulse-blue',    label: '💙 Pulse Blue' },
  { id: 'pulse-gold',    label: '💛 Pulse Gold' },
  { id: 'fire-ring',     label: '🔥 Fire Ring' },
  { id: 'rainbow-ring',  label: '🌈 Rainbow' },
  { id: 'elite',         label: '👑 Elite' },
  { id: 'aura-green',    label: '🟢 Aura Green' },
  { id: 'aura-pink',     label: '🩷 Aura Pink' },
  { id: 'ice-ring',      label: '❄️ Ice' },
  { id: 'lightning-ring',label: '⚡ Lightning' },
  { id: 'void',          label: '🌑 Void' },
  { id: 'crimson',       label: '🔴 Crimson' },
  { id: 'celestial',     label: '🌟 Celestial' },
  { id: 'toxic',         label: '☢️ Toxic' },
  { id: 'galaxy',        label: '🌌 Galaxy' },
];

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  effect?: AvatarEffectKey;
  noLink?: boolean;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm:  'w-7  h-7  text-xs',
  md:  'sm:w-8  sm:h-8  sm:text-sm w-7 h-7',
  lg:  'sm:w-12 sm:h-12 text-lg sm:text-md',
  xl:  'sm:w-20 sm:h-20 w-12 h-12 text-xl sm:text-lg',
  xxl: 'sm:w-36 sm:h-36 h-20 w-20 text-3xl sm-text-xl',
};

// Padding around the avatar so rings don't clip
const ringPad: Record<NonNullable<AvatarProps['size']>, string> = {
  sm:  'p-[2px]',
  md:  'p-[2px]',
  lg:  'p-[3px]',
  xl:  'p-[3px]',
  xxl: 'p-[4px]',
};

export default function Avatar({ name, src, size = 'sm', effect, noLink }: AvatarProps) {
  const router = useRouter();
  const [imgFailed, setImgFailed] = useState(false);

  const letter    = name?.trim().charAt(0).toUpperCase() || '?';
  const bg        = avatarColors[letter] ?? '#4b8ef1';
  const sz        = sizeClasses[size];
  const showImage = !!src && !imgFailed;

  const handleClick = () => {
    if (!noLink && name) router.push(`/u/${name}`);
  };

  const inner = showImage ? (
    <img
      src={src}
      alt={name}
      onError={() => setImgFailed(true)}
      className={`${sz} rounded-full object-cover shrink-0 block`}
    />
  ) : (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: bg }}
    >
      {letter}
    </div>
  );

  if (!effect) {
    return (
      <div onClick={handleClick} className={noLink ? '' : 'cursor-pointer'}>
        {inner}
      </div>
    );
  }

  // Rainbow uses a different technique: gradient border via background + padding
  // instead of ::before pseudo-element (which breaks in stacking contexts)
  if (effect === 'rainbow-ring' || effect === 'galaxy') {
    return (
      <>
        <style>{RING_CSS}</style>
        <div
          onClick={handleClick}
          className={`ae-grad-wrap ae-${effect} ${ringPad[size]} rounded-full ${noLink ? '' : 'cursor-pointer'} inline-block shrink-0`}
        >
          <div className="ae-grad-inner rounded-full overflow-hidden">
            {inner}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{RING_CSS}</style>
      <div
        onClick={handleClick}
        className={`ae-wrap ae-${effect} ${ringPad[size]} rounded-full ${noLink ? '' : 'cursor-pointer'} inline-block shrink-0`}
      >
        {inner}
      </div>
    </>
  );
}

const RING_CSS = `
.ae-wrap {
  display: inline-block;
  position: relative;
}

/* ── Gradient-border technique (rainbow, galaxy) ── */
.ae-grad-wrap {
  display: inline-block;
  position: relative;
  padding: 3px;
}
.ae-grad-inner {
  position: relative;
  z-index: 1;
}
.ae-rainbow-ring {
  background: conic-gradient(#ff6ec7, #ff9a44, #ffe14d, #79ff79, #4db8ff, #b163ff, #ff6ec7);
}
.ae-galaxy {
  background: conic-gradient(#0f0c29, #b163ff, #4db8ff, #0f0c29, #b163ff, #302b63, #b163ff);
  animation: ae-rainbow-spin 3s linear infinite;
}
@keyframes ae-rainbow-spin {
  to { transform: rotate(360deg); }
}

/* ── Pulse Blue ── */
.ae-pulse-blue {
  box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #4b8ef1;
  animation: ae-pulse-blue 2s ease-in-out infinite;
}
@keyframes ae-pulse-blue {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #4b8ef188, 0 0 8px 2px #4b8ef144; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #4b8ef1,   0 0 14px 4px #4b8ef166; }
}

/* ── Pulse Gold ── */
.ae-pulse-gold {
  animation: ae-pulse-gold 2s ease-in-out infinite;
}
@keyframes ae-pulse-gold {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #c9970088, 0 0 8px 2px #c9970044; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #ffd700,   0 0 16px 5px #ffd70066; }
}

/* ── Fire Ring ── */
.ae-fire-ring {
  animation: ae-fire-ring 1.6s linear infinite;
}
@keyframes ae-fire-ring {
  0%   { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6a00, 0 0 10px 3px #ee097944, 0 0 18px 4px #ff6a0033; }
  33%  { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ee0979, 0 0 12px 4px #ff6a0066, 0 0 20px 5px #ee097933; }
  66%  { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #fff700, 0 0 10px 3px #ee097944, 0 0 16px 4px #ff6a0033; }
  100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6a00, 0 0 10px 3px #ee097944, 0 0 18px 4px #ff6a0033; }
}

/* ── Elite ── */
.ae-elite {
  animation: ae-elite 3s ease-in-out infinite;
}
@keyframes ae-elite {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #b8860b, 0 0 10px 3px #b8860b44; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffd700, 0 0 18px 6px #ffd70077; }
}

/* ── Aura Green ── */
.ae-aura-green {
  animation: ae-aura-green 2.2s ease-in-out infinite;
}
@keyframes ae-aura-green {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #00c97488, 0 0 8px 3px #00c97433; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #00ff99,   0 0 18px 6px #00ff9966; }
}

/* ── Aura Pink ── */
.ae-aura-pink {
  animation: ae-aura-pink 2s ease-in-out infinite;
}
@keyframes ae-aura-pink {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6ec788, 0 0 8px 3px #ff6ec733; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6ec7,   0 0 18px 6px #ff6ec766; }
}

/* ── Ice Ring ── */
.ae-ice-ring {
  animation: ae-ice-ring 2.5s ease-in-out infinite;
}
@keyframes ae-ice-ring {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #7ad7ff88, 0 0 8px 3px #7ad7ff33; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #ffffff,   0 0 20px 6px #7ad7ff77; }
}

/* ── Lightning Ring ── */
.ae-lightning-ring {
  animation: ae-lightning-ring 1.2s linear infinite;
}
@keyframes ae-lightning-ring {
  0%, 89%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffe14d88, 0 0 6px 2px #ffe14d33; }
  90%            { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #ffffff,   0 0 22px 6px #ffe14daa; }
  91%            { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffe14d,   0 0 8px 2px #ffe14d55; }
  92%            { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 5px #ffffff,   0 0 24px 8px #ffe14dcc; }
}

/* ── Void ── */
.ae-void {
  animation: ae-void 3s ease-in-out infinite;
}
@keyframes ae-void {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #7b2fff88, 0 0 10px 3px #7b2fff33; }
  33%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #4b0082,   0 0 14px 5px #4b008266; }
  66%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #b163ff,   0 0 18px 6px #b163ff55; }
}

/* ── Crimson ── */
.ae-crimson {
  animation: ae-crimson 2s ease-in-out infinite;
}
@keyframes ae-crimson {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #dc143c88, 0 0 8px 2px #dc143c33; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #ff2d55,   0 0 20px 6px #ff2d5566; }
}

/* ── Celestial ── */
.ae-celestial {
  animation: ae-celestial 4s ease-in-out infinite;
}
@keyframes ae-celestial {
  0%   { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #4db8ff, 0 0 12px 4px #4db8ff44; }
  33%  { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffffff,  0 0 16px 5px #ffffff55; }
  66%  { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #b163ff, 0 0 14px 4px #b163ff44; }
  100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #4db8ff, 0 0 12px 4px #4db8ff44; }
}

/* ── Toxic ── */
.ae-toxic {
  animation: ae-toxic 1.8s ease-in-out infinite;
}
@keyframes ae-toxic {
  0%, 100% { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #39ff1488, 0 0 8px 3px #39ff1433; }
  50%       { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 4px #39ff14,   0 0 22px 7px #39ff1477; }
}

@media (prefers-reduced-motion: reduce) {
  .ae-wrap, .ae-grad-wrap { animation: none !important; }
  .ae-rainbow-ring, .ae-galaxy { animation: none !important; }
  .ae-pulse-blue   { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #4b8ef1; }
  .ae-pulse-gold   { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffd700; }
  .ae-fire-ring    { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6a00; }
  .ae-elite        { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffd700; }
  .ae-aura-green   { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #00ff99; }
  .ae-aura-pink    { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff6ec7; }
  .ae-ice-ring     { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #7ad7ff; }
  .ae-lightning-ring { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ffe14d; }
  .ae-void         { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #b163ff; }
  .ae-crimson      { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #ff2d55; }
  .ae-celestial    { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #4db8ff; }
  .ae-toxic        { box-shadow: 0 0 0 2px #1e1f22, 0 0 0 3px #39ff14; }
}

/* ── Mobile: disable glitch/hologram pseudo-elements to prevent layout bleed ── */
@media (max-width: 768px) {
  .ue-glitch-before,
  .ue-glitch-after {
    display: none;
  }

  .ue-glitch {
    animation: none;
  }

  .ue-hologram {
    animation: none;
  }
}
`;