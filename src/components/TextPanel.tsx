import type { GameNode } from '../data';

interface TextPanelProps {
  nodes: GameNode[];
  onRestart?: () => void;
}

const VISIBLE_NODE_LIMIT = 4;

function renderNode(node: GameNode, onRestart?: () => void) {
  switch (node.type) {
    case 'scene-heading':
      return <div key={node.id} className="py-3 mt-1"><h2 className="text-sm md:text-xl font-serif text-white/60 tracking-widest uppercase">{node.text}</h2></div>;
    case 'narration':
      return <p key={node.id} className="text-[1.05rem] md:text-lg font-serif text-white/90 leading-relaxed md:leading-loose mb-4 whitespace-pre-line">{node.text}</p>;
    case 'dialogue':
      return (
        <div key={node.id} className="mb-4">
          {node.speaker && <span className="text-xs md:text-sm font-serif text-white/50 uppercase tracking-wider block mb-1">{node.speaker}</span>}
          <p className="text-[1.05rem] md:text-lg font-serif text-white/95 leading-relaxed pl-4 border-l-2 border-white/20">{node.text}</p>
        </div>
      );
    case 'blockquote':
      return <blockquote key={node.id} className="text-center py-4 my-2"><p className="text-xl md:text-2xl font-serif text-white/80 italic tracking-wide">{node.text}</p></blockquote>;
    case 'ending':
      return (
        <div key={node.id} className="py-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{node.text}</h2>
          <p className="text-white/50 mt-4 font-serif">To be continued...</p>
          {onRestart && (
            <button onClick={(e) => { e.stopPropagation(); onRestart(); }} className="pointer-events-auto mt-6 min-h-11 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm transition-colors touch-manipulation">
              <span className="text-white/90 font-serif text-base">Play Again</span>
            </button>
          )}
        </div>
      );
    default:
      return <p key={node.id} className="text-[1.05rem] font-serif text-white/90 leading-relaxed mb-4 whitespace-pre-line">{node.text}</p>;
  }
}

export default function TextPanel({ nodes, onRestart }: TextPanelProps) {
  const visibleNodes = nodes.slice(-VISIBLE_NODE_LIMIT);

  return (
    <div className="absolute bottom-0 left-0 w-full min-h-[42%] md:min-h-[35%] flex flex-col justify-end bg-gradient-to-t from-black via-black/95 via-70% to-transparent pointer-events-none">
      <div className="px-5 md:px-6 pt-16 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-12">
        <div className="max-w-3xl mx-auto">
          {visibleNodes.map((node, index) => {
            const isCurrent = index === visibleNodes.length - 1;
            return (
              <div
                key={node.id}
                className={`transition-opacity duration-300 ${isCurrent ? 'opacity-100' : 'opacity-45'}`}
              >
                {renderNode(node, onRestart)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
