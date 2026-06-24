'use client';
import React from 'react';

export type UsernameEffectKey =
  | 'gold'
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'rainbow'
  | 'glitch'
  | 'neon-green'
  | 'neon-pink'
  | 'void'
  | 'crimson'
  | 'celestial'
  | 'toxic'
  | 'aurora'
  | 'shadow'
  | 'hologram'
  | null
  | undefined;

interface UsernameEffectProps {
  name: string;
  effect?: UsernameEffectKey;
  className?: string;
}

export const USERNAME_EFFECTS: {
  id: UsernameEffectKey;
  label: string;
}[] = [
  { id: null,         label: 'None' },
  { id: 'gold',       label: '✨ Gold' },
  { id: 'fire',       label: '🔥 Fire' },
  { id: 'ice',        label: '❄️ Ice' },
  { id: 'lightning',  label: '⚡ Lightning' },
  { id: 'rainbow',    label: '🌈 Rainbow' },
  { id: 'glitch',     label: '👾 Glitch' },
  { id: 'neon-green', label: '💚 Neon Green' },
  { id: 'neon-pink',  label: '🩷 Neon Pink' },
  { id: 'void',       label: '🌑 Void' },
  { id: 'crimson',    label: '🔴 Crimson' },
  { id: 'celestial',  label: '🌟 Celestial' },
  { id: 'toxic',      label: '☢️ Toxic' },
  { id: 'aurora',     label: '🌌 Aurora' },
  { id: 'shadow',     label: '🖤 Shadow' },
  { id: 'hologram',   label: '💠 Hologram' },
];

export default function UsernameEffect({ name, effect, className = '' }: UsernameEffectProps) {
  if (!effect) return <span className={className}>{name}</span>;

  return (
    <>
      <style>{EFFECT_CSS}</style>
      <span className={`ue-${effect} ${className}`} data-text={name}>
        {effect === 'glitch' || effect === 'hologram' ? (
          <>
            <span aria-hidden="true" className="ue-glitch-before" data-text={name} />
            {name}
            <span aria-hidden="true" className="ue-glitch-after" data-text={name} />
          </>
        ) : (
          name
        )}
      </span>
    </>
  );
}

const EFFECT_CSS = `
[class^="ue-"] {
  display: inline-block;
  font-weight: 700;
  position: relative;
}

/* ── Gold ── */
.ue-gold {
  background: linear-gradient(90deg, #b8860b, #ffd700, #f5c842, #ffd700, #b8860b);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 2.4s linear infinite;
}

/* ── Fire ── */
.ue-fire {
  background: linear-gradient(180deg, #fff700 0%, #ff6a00 40%, #ee0979 100%);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-fire 1.4s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 4px #ff6a0088);
}

/* ── Ice ── */
.ue-ice {
  background: linear-gradient(90deg, #a8edff, #ffffff, #7ad7ff, #c8f4ff, #a8edff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 2s linear infinite;
  filter: drop-shadow(0 0 5px #7ad7ff88);
}

/* ── Lightning ── */
.ue-lightning {
  background: linear-gradient(90deg, #ffe14d 0%, #ffffff 20%, #ffe14d 40%, #fff5a0 55%, #ffffff 70%, #ffe14d 100%);
  background-size: 250% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-lightning 1.1s linear infinite;
  filter: drop-shadow(0 0 6px #ffe14d99);
}

/* ── Rainbow ── */
.ue-rainbow {
  background: linear-gradient(90deg, #ff6ec7, #ff9a44, #ffe14d, #79ff79, #4db8ff, #b163ff, #ff6ec7);
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 2s linear infinite;
}

/* ── Glitch ── */
.ue-glitch {
  color: #b163ff;
  animation: ue-glitch-main 3.5s infinite;
}
.ue-glitch-before,
.ue-glitch-after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  overflow: hidden;
}
.ue-glitch-before {
  color: #00ffcc;
  animation: ue-glitch-top 3.5s infinite;
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
}
.ue-glitch-after {
  color: #ff2d78;
  animation: ue-glitch-bottom 3.5s infinite;
  clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
}

/* ── Neon Green ── */
.ue-neon-green {
  color: #39ff14;
  filter: drop-shadow(0 0 4px #39ff1499) drop-shadow(0 0 10px #39ff1444);
  animation: ue-neon-green 2s ease-in-out infinite;
}
@keyframes ue-neon-green {
  0%, 100% { filter: drop-shadow(0 0 3px #39ff1466) drop-shadow(0 0 8px #39ff1433); }
  50%       { filter: drop-shadow(0 0 6px #39ff14bb) drop-shadow(0 0 16px #39ff1466); }
}

/* ── Neon Pink ── */
.ue-neon-pink {
  color: #ff6ec7;
  animation: ue-neon-pink 2s ease-in-out infinite;
}
@keyframes ue-neon-pink {
  0%, 100% { filter: drop-shadow(0 0 3px #ff6ec766) drop-shadow(0 0 8px #ff6ec733); }
  50%       { filter: drop-shadow(0 0 6px #ff6ec7bb) drop-shadow(0 0 16px #ff6ec766); }
}

/* ── Void ── */
.ue-void {
  background: linear-gradient(90deg, #4b0082, #b163ff, #7b2fff, #b163ff, #4b0082);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 3s linear infinite;
  filter: drop-shadow(0 0 6px #b163ff66);
}

/* ── Crimson ── */
.ue-crimson {
  background: linear-gradient(90deg, #8b0000, #ff2d55, #dc143c, #ff2d55, #8b0000);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 2.5s linear infinite;
  filter: drop-shadow(0 0 5px #ff2d5555);
}

/* ── Celestial ── */
.ue-celestial {
  background: linear-gradient(90deg, #4db8ff, #ffffff, #b163ff, #ffffff, #4db8ff);
  background-size: 250% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 3s linear infinite;
  filter: drop-shadow(0 0 6px #4db8ff55);
}

/* ── Toxic ── */
.ue-toxic {
  background: linear-gradient(90deg, #1a5c00, #39ff14, #7fff00, #39ff14, #1a5c00);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 1.8s linear infinite;
  filter: drop-shadow(0 0 5px #39ff1466);
}

/* ── Aurora ── */
.ue-aurora {
  background: linear-gradient(90deg, #00c9ff, #79ff79, #b163ff, #00c9ff, #79ff79);
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ue-shimmer 4s linear infinite;
  filter: drop-shadow(0 0 6px #00c9ff44);
}

/* ── Shadow ── */
.ue-shadow {
  color: #c8c9d4;
  animation: ue-shadow 3s ease-in-out infinite;
}
@keyframes ue-shadow {
  0%, 100% { filter: drop-shadow(0 0 2px #00000099) drop-shadow(2px 2px 4px #00000066); }
  50%       { filter: drop-shadow(0 0 4px #000000cc) drop-shadow(3px 3px 8px #000000aa); color: #e4e6eb; }
}

/* ── Hologram ── */
.ue-hologram {
  color: #4db8ff;
  animation: ue-hologram 2.5s ease-in-out infinite;
}
.ue-hologram .ue-glitch-before {
  color: #79ff79;
  animation: ue-holo-flicker 2.5s infinite;
  clip-path: polygon(0 20%, 100% 20%, 100% 50%, 0 50%);
  opacity: 0.6;
}
.ue-hologram .ue-glitch-after {
  color: #ff6ec7;
  animation: ue-holo-flicker2 2.5s infinite;
  clip-path: polygon(0 55%, 100% 55%, 100% 80%, 0 80%);
  opacity: 0.6;
}
@keyframes ue-hologram {
  0%, 100% { filter: drop-shadow(0 0 3px #4db8ff66); opacity: 1; }
  45%       { filter: drop-shadow(0 0 8px #4db8ffaa); opacity: 0.85; }
  50%       { opacity: 0.6; filter: drop-shadow(0 0 2px #4db8ff33); }
  55%       { opacity: 1; }
}
@keyframes ue-holo-flicker {
  0%, 48%, 52%, 100% { transform: translate(0); opacity: 0; }
  49%                { transform: translate(-2px, 0); opacity: 0.7; }
  51%                { transform: translate(2px, 0);  opacity: 0.7; }
}
@keyframes ue-holo-flicker2 {
  0%, 46%, 54%, 100% { transform: translate(0); opacity: 0; }
  48%                { transform: translate(2px, 0);  opacity: 0.6; }
  52%                { transform: translate(-2px, 0); opacity: 0.6; }
}

/* ── Keyframes ── */
@keyframes ue-shimmer {
  to { background-position: 200% center; }
}
@keyframes ue-fire {
  0%   { background-position: 0 0; }
  100% { background-position: 0 100%; }
}
@keyframes ue-lightning {
  0%   { background-position: 200% center; }
  60%  { background-position: -20% center; }
  61%  { opacity: 0.6; }
  62%  { opacity: 1; }
  100% { background-position: -20% center; }
}
@keyframes ue-glitch-main {
  0%, 90%, 100% { transform: translate(0); }
  91%           { transform: translate(-2px, 1px); }
  93%           { transform: translate(2px, -1px); }
  95%           { transform: translate(-1px, 2px); }
}
@keyframes ue-glitch-top {
  0%, 90%, 100% { transform: translate(0); opacity: 0; }
  91%           { transform: translate(-3px, 0); opacity: 0.85; }
  94%           { transform: translate(2px, 0);  opacity: 0.85; }
  96%           { opacity: 0; }
}
@keyframes ue-glitch-bottom {
  0%, 88%, 100% { transform: translate(0); opacity: 0; }
  89%           { transform: translate(3px, 0); opacity: 0.85; }
  92%           { transform: translate(-2px, 0); opacity: 0.85; }
  95%           { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  [class^="ue-"] { animation: none !important; }
  .ue-gold, .ue-fire, .ue-ice, .ue-lightning, .ue-rainbow,
  .ue-void, .ue-crimson, .ue-celestial, .ue-toxic, .ue-aurora {
    -webkit-text-fill-color: unset;
    background: none;
    color: inherit;
  }
}
`;