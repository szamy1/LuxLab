import { CalculationResult, LayoutConfig, PhotometryData, RoomConfig } from '../types/lighting';

interface Point2D {
  x: number;
  y: number;
}

/** Compute a simple RCR (Room Cavity Ratio) for information. */
export function calculateRCR(room: RoomConfig): number {
  const cavityHeight = room.height - room.workplaneHeight;
  if (cavityHeight <= 0) return 0;
  const rcr = (5 * cavityHeight * (room.length + room.width)) / (room.length * room.width);
  return Number(rcr.toFixed(2));
}

/**
 * Compute illuminance (lux) grid for a rectangular room with evenly spaced luminaires.
 * This is a simplified point-by-point calculation for interactive previews.
 */
export function calculateIlluminanceGrid(
  room: RoomConfig,
  layout: LayoutConfig,
  photometry: PhotometryData,
  gridResolution = 18,
  samplesPerPoint = 1
): CalculationResult {
  const positions = createLuminairePositions(room, layout);
  const dz = Math.max(room.mountingHeight - room.workplaneHeight, 0.1);
  const sampleGrid = Math.max(1, Math.floor(samplesPerPoint));

  const rows: number[][] = [];
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  let total = 0;
  const cellCount = Math.max(gridResolution, 1);
  const spacingX = room.length / cellCount;
  const spacingY = room.width / cellCount;
  const sampleCount = sampleGrid * sampleGrid;

  for (let rowIndex = 0; rowIndex < gridResolution; rowIndex += 1) {
    const row: number[] = [];
    const yBase = ((rowIndex + 0.5) / gridResolution) * room.width;

    for (let colIndex = 0; colIndex < gridResolution; colIndex += 1) {
      const xBase = ((colIndex + 0.5) / gridResolution) * room.length;
      let sampleSum = 0;

      for (let sy = 0; sy < sampleGrid; sy += 1) {
        for (let sx = 0; sx < sampleGrid; sx += 1) {
          const offsetX = ((sx + 0.5) / sampleGrid - 0.5) * spacingX;
          const offsetY = ((sy + 0.5) / sampleGrid - 0.5) * spacingY;
          const x = clamp(xBase + offsetX, 0, room.length);
          const y = clamp(yBase + offsetY, 0, room.width);
          sampleSum += computePointIlluminance({ x, y }, dz, positions, photometry);
        }
      }

      const value = sampleSum / sampleCount;
      const rounded = Number(value.toFixed(2));
      row.push(rounded);
      total += rounded;
      min = Math.min(min, rounded);
      max = Math.max(max, rounded);
    }

    rows.push(row);
  }

  const count = gridResolution * gridResolution;
  const average = count ? total / count : 0;
  const uniformity = average > 0 ? min / average : 0;

  return {
    grid: rows,
    average,
    min,
    max,
    uniformity
  };
}

function computePointIlluminance(
  point: Point2D,
  dz: number,
  luminairePositions: Point2D[],
  photometry: PhotometryData
): number {
  let illuminance = 0;
  for (const luminaire of luminairePositions) {
    const dx = point.x - luminaire.x;
    const dy = point.y - luminaire.y;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance === 0) continue;

    const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
    const verticalAngle = (Math.atan2(horizontalDistance, dz) * 180) / Math.PI; // 0 = nadir
    let horizontalAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (horizontalAngle < 0) horizontalAngle += 360;

    const candela = interpolateCandela(photometry, horizontalAngle, verticalAngle);
    const cosTheta = dz / distance; // cos of vertical angle
    const lux = (candela * cosTheta) / (distance * distance);
    illuminance += lux;
  }

  return illuminance;
}

export function createLuminairePositions(room: RoomConfig, layout: LayoutConfig): Point2D[] {
  const positions: Point2D[] = [];
  const totalLength = (layout.columns - 1) * layout.columnSpacing;
  const totalWidth = (layout.rows - 1) * layout.rowSpacing;
  const originX = Number.isFinite(layout.offsetX) ? layout.offsetX : (room.length - totalLength) / 2;
  const originY = Number.isFinite(layout.offsetY) ? layout.offsetY : (room.width - totalWidth) / 2;

  for (let r = 0; r < layout.rows; r += 1) {
    for (let c = 0; c < layout.columns; c += 1) {
      positions.push({ x: originX + c * layout.columnSpacing, y: originY + r * layout.rowSpacing });
    }
  }

  return positions;
}

function interpolateCandela(
  photometry: PhotometryData,
  horizontalAngle: number,
  verticalAngle: number
): number {
  const { horizontalAngles, verticalAngles, candelas } = photometry;
  if (!horizontalAngles.length || !verticalAngles.length) return 0;

  const hIndex = findSurroundingIndices(horizontalAngles, horizontalAngle % 360);
  const vIndex = findSurroundingIndices(verticalAngles, verticalAngle);

  const h0 = horizontalAngles[hIndex.low];
  const h1 = horizontalAngles[hIndex.high];
  const v0 = verticalAngles[vIndex.low];
  const v1 = verticalAngles[vIndex.high];

  const q11 = candelas[hIndex.low] ? candelas[hIndex.low][vIndex.low] : 0;
  const q12 = candelas[hIndex.low] ? candelas[hIndex.low][vIndex.high] : 0;
  const q21 = candelas[hIndex.high] ? candelas[hIndex.high][vIndex.low] : 0;
  const q22 = candelas[hIndex.high] ? candelas[hIndex.high][vIndex.high] : 0;

  const hSpan = h1 - h0 || 1;
  const vSpan = v1 - v0 || 1;
  const hT = clamp((horizontalAngle - h0) / hSpan, 0, 1);
  const vT = clamp((verticalAngle - v0) / vSpan, 0, 1);

  const q1 = q11 + (q21 - q11) * hT;
  const q2 = q12 + (q22 - q12) * hT;
  return q1 + (q2 - q1) * vT;
}

function findSurroundingIndices(list: number[], target: number) {
  if (target <= list[0]) return { low: 0, high: 0 };
  if (target >= list[list.length - 1]) return { low: list.length - 1, high: list.length - 1 };

  for (let i = 0; i < list.length - 1; i += 1) {
    if (target >= list[i] && target <= list[i + 1]) {
      return { low: i, high: i + 1 };
    }
  }

  return { low: list.length - 1, high: list.length - 1 };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
