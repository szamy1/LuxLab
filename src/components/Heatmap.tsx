import { useMemo, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { RoomConfig } from '../types/lighting';

interface HeatmapProps {
  grid: number[][];
  room: Pick<RoomConfig, 'length' | 'width'>;
  resolution: number;
  spacing: { length: number; width: number };
  luminairePositions: { x: number; y: number }[];
}

interface HoverInfo {
  value: number;
  row: number;
  col: number;
}

export function Heatmap({ grid, room, resolution, spacing, luminairePositions }: HeatmapProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const flatValues = useMemo(() => grid.flat(), [grid]);
  const min = Math.min(...flatValues, 0);
  const max = Math.max(...flatValues, 1);
  const rowsCount = grid.length || 1;
  const colsCount = grid[0]?.length || 1;
  const aspectRatio = room.length > 0 && room.width > 0 ? room.length / room.width : 1;

  return (
    <div className="space-y-3" data-card>
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold">Workplane Heatmap</h3>
          <p className="helper-text">Hover to inspect exact lux at a point.</p>
        </div>
        {hover && (
          <div className="text-sm text-text-main">
            <span className="font-semibold">{hover.value.toFixed(1)} lux</span>
            <span className="text-text-muted"> at row {hover.row + 1}, col {hover.col + 1}</span>
          </div>
        )}
      </div>
      <div className="px-4 pb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span>
            Resolution {resolution}x{resolution}
          </span>
          <span>· Spacing ~{spacing.length}m x {spacing.width}m</span>
          <span className="ml-auto">Scroll to zoom, drag to pan</span>
        </div>
        <TransformWrapper minScale={0.8} maxScale={6} wheel={{ step: 0.12 }}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="mb-2 flex gap-2 justify-end text-xs">
                <button className="button-secondary" onClick={() => zoomIn()}>
                  Zoom in
                </button>
                <button className="button-secondary" onClick={() => zoomOut()}>
                  Zoom out
                </button>
                <button className="button-secondary" onClick={() => resetTransform()}>
                  Reset view
                </button>
              </div>
              <TransformComponent
                wrapperClass="w-full"
                contentClass="w-full"
              >
                <div
                  className="grid w-full overflow-hidden rounded-xl border border-border-subtle"
                  style={{
                    aspectRatio: `${aspectRatio}`,
                    minHeight: '260px',
                    gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rowsCount}, minmax(0, 1fr))`
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((value, colIndex) => {
                      const color = toColor(value, min, max);
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          onMouseEnter={() => setHover({ value, row: rowIndex, col: colIndex })}
                          style={{
                            background: color,
                            border: '1px solid rgba(255,255,255,0.02)'
                          }}
                          title={`${value.toFixed(1)} lux`}
                        />
                      );
                    })
                  )}
                  {luminairePositions.map((pos, idx) => {
                    const xPct = (pos.x / room.length) * 100;
                    const yPct = (pos.y / room.width) * 100;
                    return (
                      <div
                        key={`lm-${idx}`}
                        className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-text-inverted bg-text-inverted/90 text-[9px] font-bold text-background"
                        style={{ left: `${xPct}%`, top: `${yPct}%` }}
                        title={`Luminaire ${idx + 1}`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
        <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
          <span>{min.toFixed(0)} lux</span>
          <div className="h-2 flex-1 bg-gradient-to-r from-blue-500 via-yellow-300 to-red-500 rounded-full" />
          <span>{max.toFixed(0)} lux</span>
        </div>
      </div>
    </div>
  );
}

function toColor(value: number, min: number, max: number) {
  const clamped = Math.min(Math.max(value, min), max);
  const t = max === min ? 0 : (clamped - min) / (max - min);
  const hue = 220 - t * 220; // blue to red
  const lightness = 35 + t * 20;
  return `hsl(${hue}, 75%, ${lightness}%)`;
}
