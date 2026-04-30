import type { ChoiceOption } from '../data';

interface ChoiceOverlayProps {
  choicePrompt: string;
  choiceOptions: ChoiceOption[];
  onChoice: (choiceId: string) => void;
}

const CHOICE_TONE: Record<string, string> = {
  '1A': 'Survival',
  '1B': 'Resolve',
  '1C': 'Suspicion',
  '2A': 'Debt',
  '2B': 'Silence',
  '2C': 'Truth',
  '3A': 'Duty',
  '3B': 'Grace',
  '3C': 'Both',
};

export default function ChoiceOverlay({ choicePrompt, choiceOptions, onChoice }: ChoiceOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center md:items-center bg-black/55 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-5xl">
        <p className="text-center text-white/50 tracking-[0.25em] text-[11px] md:text-sm uppercase mb-4 md:mb-6">
          {choicePrompt}
        </p>
        <div className="flex flex-col gap-2.5 md:grid md:grid-cols-3 md:gap-3">
          {choiceOptions.map((choice) => (
            <button
              key={choice.id}
              onClick={(e) => { e.stopPropagation(); onChoice(choice.id); }}
              className="touch-manipulation text-left border border-white/20 bg-black/75 hover:bg-white/10 hover:border-white/40 active:bg-white/15 active:scale-[0.99] px-4 py-4 md:px-5 md:py-5 transition-[background-color,border-color,transform] min-h-[5.75rem] md:min-h-[8rem] rounded-sm"
            >
              <div className="flex items-center justify-between gap-3 text-white/35 text-[11px] tracking-widest mb-2.5 uppercase">
                <span>{choice.id}</span>
                <span>{CHOICE_TONE[choice.id]}</span>
              </div>
              <div className="text-white/95 text-lg md:text-xl font-serif leading-tight">{choice.label}</div>
              <div className="text-white/55 text-sm font-serif leading-snug md:leading-relaxed mt-1.5">{choice.intent}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
