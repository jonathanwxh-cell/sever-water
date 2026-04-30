import { useRef, useEffect } from 'react';
import type { GameNode } from '../data';

interface TextPanelProps {
  nodes: GameNode[];
  onRestart?: () => void;
}

const VISIBLE_NODE_LIMIT = 3;

function renderNode(node: GameNode, onRestart?: () => void) {
  switch (node.type) {
    case 'scene-heading':
      return <div key={node.id} className="py-4 mt-2"><h2 className="text-lg md:text-xl font-serif text-white/60 tracking-widest uppercase">{node.text}</h2></div>;
    case 'narration':
      return <p key={node.id} className="text-base md:text-lg font-serif text-white/90 leading-loose mb-6 whitespace-pre-line">{node.text}</p>;
    case 'dialogue':
      return (
        <div key={node.id} className="mb-4">
          {node.speaker && <span className="text-sm font-serif text-white/50 uppercase tracking-wider block mb-1">{node.speaker}</span>}
          <p className="text-base md:text-lg font-serif text-white/95 leading-relaxed pl-4 border-l-2 border-white/20">{node.text}</p>
        </div>
      );
    case 'blockquote':
      return <blockquote key={node.id} className="text-center py-6 my-4"><p className="text-xl md:text-2xl font-serif text-white/80 italic tracking-wide">{node.text}</p></blockquote>;
    case 'ending':
      return (
        <div key={node.id} className="py-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-widest">{node.text}</h2>
          <p className="text-white/50 mt-4 font-serif">To be continued...</p>
          {onRestart && (
            <button onClick={(e) => { e.stopPropagation(); onRestart(); }} className="mt-6 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm transition-colors">
              <span className="text-white/90 font-serif text-base">Play Again</span>
            </button>
          )}
        </div>
      );
    default:
      return <p key={node.id} className="text-base font-serif text-white/90 leading-loose mb-6 whitespace-pre-line">{node.text}</p>;
  }
}

export default function TextPanel({ nodes, onRestart }: TextPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [nodes]);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[45%] md:h-[35%] flex flex-col bg-gradient-to-t from-black via-black/95 via-65% to-transparent pointer-events-none">
      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-20 md:pb-12">
        <div className="max-w-3xl mx-auto">
          {nodes.slice(-VISIBLE_NODE_LIMIT).map((node) => renderNode(node, onRestart))}
          <div ref={scrollRef} />
        </div>
      </div>
    </div>
  );
}
