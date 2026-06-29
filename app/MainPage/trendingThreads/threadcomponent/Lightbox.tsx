/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useCallback, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Drag state
  const dragging   = useRef(false);
  const dragStart  = useRef({ x: 0, y: 0 });
  const offsetBase = useRef({ x: 0, y: 0 });

  // Pinch state
  const lastPinchDist = useRef<number | null>(null);

  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const prev = useCallback(() => {
    resetZoom();
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const next = useCallback(() => {
    resetZoom();
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (scale > 1) resetZoom(); else onClose(); }
      if (e.key === "ArrowLeft"  && scale === 1) prev();
      if (e.key === "ArrowRight" && scale === 1) next();
      if (e.key === "+"  || e.key === "=") setScale(s => Math.min(s + 0.5, 5));
      if (e.key === "-")                    setScale(s => Math.max(s - 0.5, 1));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, prev, next, scale]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Mouse drag ─────────────────────────────────────────────────────────────
const onMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    e.preventDefault();
    dragging.current   = true;
    setIsDragging(true);
    dragStart.current  = { x: e.clientX, y: e.clientY };
    offsetBase.current = offset;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setOffset({
      x: offsetBase.current.x + e.clientX - dragStart.current.x,
      y: offsetBase.current.y + e.clientY - dragStart.current.y,
    });
  };

 const onMouseUp = () => { 
  dragging.current = false; 
  setIsDragging(false);
};

  // ── Scroll to zoom ─────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(s => Math.min(Math.max(s + delta, 1), 5));
    if (scale + delta <= 1) setOffset({ x: 0, y: 0 });
  };

  // ── Pinch to zoom ──────────────────────────────────────────────────────────
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current !== null) {
        const delta = (dist - lastPinchDist.current) * 0.01;
        setScale(s => Math.min(Math.max(s + delta, 1), 5));
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      // Single-finger pan when zoomed
      if (dragging.current) {
        setOffset({
          x: offsetBase.current.x + e.touches[0].clientX - dragStart.current.x,
          y: offsetBase.current.y + e.touches[0].clientY - dragStart.current.y,
        });
      }
    }
  };

const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      dragging.current   = true;
      setIsDragging(true);
      dragStart.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      offsetBase.current = offset;
    }
    if (e.touches.length === 2) lastPinchDist.current = null;
  };

  const onTouchEnd = () => {
    dragging.current      = false;
    setIsDragging(false);
    lastPinchDist.current = null;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };
  const isZoomed = scale > 1;

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={isZoomed ? undefined : onClose}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={16} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono z-10">
          {index + 1} / {images.length}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 1)); if (scale - 0.5 <= 1) setOffset({ x: 0, y: 0 }); }}
          disabled={scale <= 1}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        {isZoomed && (
          <button
            onClick={(e) => { e.stopPropagation(); resetZoom(); }}
            className="px-3 h-9 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            {Math.round(scale * 100)}% · reset
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 5)); }}
          disabled={scale >= 5}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Prev */}
      {images.length > 1 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Image */}
      <img
        key={images[index]}
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isZoomed) resetZoom();
          else setScale(2);
        }}
        className="max-w-[90vw] max-h-[85vh] rounded-lg object-contain select-none"
       style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transition: isDragging ? "none" : "transform 0.15s ease",
          cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default",
          animation: "fadeIn 0.15s ease",
        }}
        draggable={false}
      />

      {/* Next */}
      {images.length > 1 && !isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}