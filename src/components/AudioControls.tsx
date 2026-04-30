import { useState } from 'react';

interface AudioControlsProps {
  phase: 'title' | 'playing' | 'ended';
  volume: number;
  onVolumeChange: (v: number) => void;
  onReturnToTitle?: () => void;
}

export default function AudioControls({ phase, volume, onVolumeChange, onReturnToTitle }: AudioControlsProps) {
  const [showVolSlider, setShowVolSlider] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-50 flex items-center gap-1 safe-top">
      {phase !== 'title' && onReturnToTitle && (
        <button
          onClick={(e) => { e.stopPropagation(); onReturnToTitle(); }}
          className="min-h-11 min-w-11 flex items-center justify-center text-white/50 hover:text-white/80 active:text-white p-2 touch-manipulation"
          aria-label="Return to title"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      )}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowVolSlider(!showVolSlider); }}
          className="min-h-11 min-w-11 flex items-center justify-center text-white/50 hover:text-white/80 active:text-white p-2 touch-manipulation"
          aria-label="Volume"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </button>
        {showVolSlider && (
          <div className="absolute top-full right-0 mt-2 p-3 bg-black/80 rounded-sm" onClick={(e) => e.stopPropagation()}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-28 accent-white/60"
            />
          </div>
        )}
      </div>
    </div>
  );
}
