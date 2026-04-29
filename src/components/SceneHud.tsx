

interface SceneHudProps {
  sceneMeta: { scene?: string; location?: string; mood?: string };
}

export default function SceneHud({ sceneMeta }: SceneHudProps) {
  if (!sceneMeta.scene && !sceneMeta.location && !sceneMeta.mood) return null;

  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none safe-top">
      {sceneMeta.scene && (
        <div className="text-white/50 text-[10px] md:text-xs tracking-[0.3em] uppercase font-serif drop-shadow-md">
          {sceneMeta.scene}
        </div>
      )}
      {(sceneMeta.location || sceneMeta.mood) && (
        <div className="text-white/40 text-[10px] md:text-xs tracking-[0.25em] uppercase font-serif mt-1 drop-shadow-md">
          {[sceneMeta.location, sceneMeta.mood].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}
