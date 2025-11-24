import { describe, expect, it } from 'vitest';
import { calculateIlluminanceGrid, createLuminairePositions } from '../src/lib/photometryEngine';
import { LayoutConfig, RoomConfig } from '../src/types/lighting';

const room: RoomConfig = {
  length: 4,
  width: 4,
  height: 3,
  mountingHeight: 2.8,
  workplaneHeight: 0.8,
  reflectances: { ceiling: 0.8, walls: 0.5, floor: 0.2 }
};

const layout: LayoutConfig = {
  rows: 1,
  columns: 1,
  rowSpacing: 0,
  columnSpacing: 0,
  offsetX: 2,
  offsetY: 2
};

const photometry = {
  verticalAngles: [0, 40, 80],
  horizontalAngles: [0],
  candelas: [[1000, 800, 200]],
  totalLumens: 3000
};

describe('photometryEngine', () => {
  it('positions a single luminaire at provided offsets', () => {
    const positions = createLuminairePositions(room, layout);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toEqual({ x: 2, y: 2 });
  });

  it('computes illuminance grid with peak under luminaire', () => {
    const result = calculateIlluminanceGrid(room, layout, photometry, 3);
    expect(result.grid[1][1]).toBeGreaterThan(200);
    expect(result.max).toBeGreaterThan(result.min);
    expect(result.average).toBeGreaterThan(0);
  });
});
