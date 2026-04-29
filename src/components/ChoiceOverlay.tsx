import type { ChoiceOption } from '../data';

interface ChoiceOverlayProps {
  choicePrompt: string;
  choiceOptions: ChoiceOption[];
  onChoice: (choiceId: string) => void;
}

export default function ChoiceOverlay({ choicePrompt, choiceOptions, onChoice }: ChoiceOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-end md:justify-center bg-black/60 px-5 pt-16 pb-10 safe-bottom safe-top overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-5xl">
        <p className="text-center text-white/50 tracking-[0.3em] text-xs md:text-sm uppercase mb-6">
          {choicePrompt}
        </p>
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3">
          {choiceOptions.map((choice) => (
            <button
              key={choice.id}
              onClick={(e) => { e.stopPropagation(); onChoice(choice.id); }}
              className="text-left border border-white/20 bg-black/70 hover:bg-white/10 hover:border-white/40 active:bg-white/15 px-5 py-5 transition-colors min-h-[8rem]"
            >
              <div className="text-white/35 text-xs tracking-widest mb-3">{choice.id}</div>
              <div className="text-white/95 text-lg md:text-xl font-serif leading-tight">{choice.label}</div>
              <div className="text-white/55 text-sm font-serif leading-relaxed mt-2">{choice.intent}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
