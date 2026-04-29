interface TitleScreenProps {
  titleFade: boolean;
  hasSave: boolean;
  onClick: () => void;
  onBeginAnew: () => void;
}

export default function TitleScreen({ titleFade, hasSave, onClick, onBeginAnew }: TitleScreenProps) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-2000 ${titleFade ? 'opacity-0' : 'opacity-100'}`}
      onClick={onClick}
    >
      <h1 className="text-6xl md:text-8xl font-serif text-white tracking-widest mb-6 drop-shadow-lg">断水</h1>
      <p className="text-xl md:text-2xl font-serif text-white/80 tracking-wide drop-shadow-md">SEVER WATER</p>
      <p className="text-lg md:text-xl font-serif text-white/60 tracking-widest mt-2 drop-shadow-md">ACT 1 · THE DEBT</p>
      <p className="text-xs font-serif text-white/30 tracking-widest mt-12 animate-pulse uppercase">
        {hasSave ? 'Tap to continue' : 'Tap to begin'}
      </p>
      {hasSave && (
        <button
          onClick={(e) => { e.stopPropagation(); onBeginAnew(); }}
          className="mt-6 text-[10px] font-serif text-white/25 hover:text-white/50 tracking-[0.2em] uppercase underline-offset-4 hover:underline transition-colors"
        >
          Begin Anew
        </button>
      )}
    </div>
  );
}
