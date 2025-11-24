import { createLuminairePositions } from '../lib/photometryEngine';
import { LayoutConfig, RoomConfig } from '../types/lighting';

interface Props {
  room: RoomConfig;
  layout: LayoutConfig;
}

export function LayoutSchematic({ room, layout }: Props) {
  const positions = createLuminairePositions(room, layout);
  const ratioPercent =
    room.length > 0 && room.width > 0 ? (room.width / room.length) * 100 : 100;

  return (
    <div data-card className="p-4 space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Layout Schematic</h3>
        <p className="helper-text">Top-down view of luminaire positions.</p>
      </div>
      <div className="relative w-full" style={{ paddingBottom: `${ratioPercent}%` }}>
        <div className="absolute inset-0 rounded-xl border border-border-subtle bg-surface-muted overflow-hidden">
          <div className="absolute inset-0 border-2 border-dashed border-border-subtle rounded-lg" />
          {positions.map((pos, index) => {
            const xPct = (pos.x / room.length) * 100;
            const yPct = (pos.y / room.width) * 100;
            return (
              <div
                key={index}
                className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-accent text-[10px] font-semibold text-text-inverted shadow"
                style={{ left: `${xPct}%`, top: `${yPct}%` }}
                title={`Luminaire ${index + 1}`}
              >
                {index + 1}
              </div>
            );
          })}
          <div className="absolute left-2 top-2 rounded-md bg-background-elevated px-2 py-1 text-[11px] text-text-muted">
            Length {room.length}m · Width {room.width}m
          </div>
        </div>
      </div>
    </div>
  );
}
