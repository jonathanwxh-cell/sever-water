interface EndingScreenProps {
  text: string;
  onRestart: () => void;
}

export default function EndingScreen({ text, onRestart }: EndingScreenProps) {
  return (
    <div className="py-8 text-center">
      <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{text}</h2>
      <p className="text-white/50 mt-4 font-serif">To be continued...</p>
      <button
        onClick={(e) => { e.stopPropagation(); onRestart(); }}
        className="mt-6 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm transition-colors"
      >
        <span className="text-white/90 font-serif text-base">Play Again</span>
      </button>
    </div>
  );
}
