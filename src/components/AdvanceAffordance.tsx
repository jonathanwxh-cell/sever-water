interface AdvanceAffordanceProps {
  narrationActive: boolean;
}

export default function AdvanceAffordance({ narrationActive }: AdvanceAffordanceProps) {
  return (
    <div className="absolute bottom-0 left-0 w-full z-30 safe-bottom pointer-events-none">
      <div className="flex items-center justify-center pb-4 pointer-events-none">
        <div className="text-white/40 text-[11px] md:text-xs font-serif uppercase tracking-[0.25em] animate-pulse">
          {narrationActive ? 'Tap to skip narration' : 'Tap to continue'}
        </div>
      </div>
    </div>
  );
}
