interface TitleScreenProps {
  titleFade: boolean;
  hasSave: boolean;
  onStart: () => void;
  onBeginAnew: () => void;
}

export default function TitleScreen({ titleFade, hasSave, onStart, onBeginAnew }: TitleScreenProps) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onStart(); }}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700 pointer-events-auto ${titleFade ? 'opacity-0' : 'opacity-100'}`}
    >
      <h1 className="text-6xl md:text-8xl font-serif text-white tracking-widest mb-6 drop-shadow-lg">断水</h1>
      <p className="text-xl md:text-2xl font-serif text-white/80 tracking-wide drop-shadow-md">SEVER WATER</p>
      <p className="text-lg md:text-xl font-serif text-white/60 tracking-widest mt-2 drop-shadow-md">ACT 1 · THE DEBT</p>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onStart(); }}
        className="mt-12 min-h-11 min-w-44 px-7 py-3 border border-white/25 bg-black/35 hover:bg-white/10 active:bg-white/15 text-white/75 hover:text-white/95 text-xs font-serif tracking-[0.25em] uppercase transition-colors touch-manipulation"
      >
        {hasSave ? 'Continue' : 'Begin'}
      </button>

      {hasSave && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onBeginAnew(); }}
          className="mt-3 min-h-11 min-w-44 px-7 py-3 text-[11px] font-serif text-white/45 hover:text-white/80 tracking-[0.22em] uppercase underline-offset-4 hover:underline transition-colors touch-manipulation"
        >
          Begin Anew
        </button>
      )}
    </div>
  );
}
