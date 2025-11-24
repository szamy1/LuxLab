import { PhotometryData } from '../types/lighting';

export interface IESParseResult {
  photometry: PhotometryData;
  totalLumens: number;
  maxCandela: number;
}

class IESParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IESParseError';
  }
}

const numberPattern = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

/**
 * Advanced LM-63 parser with tolerance for odd spacing and metadata handling.
 * Supports TILT=NONE and TILT=INCLUDE (applies tilt multipliers), normalizes angles,
 * and preserves metadata for UI display.
 */
export function parseIES(text: string): IESParseResult {
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((line) => line.trim());
  if (!lines.length) throw new IESParseError('Empty IES file');

  const metadata: Record<string, string> = {};
  let tiltLineIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (raw.toUpperCase().startsWith('TILT=')) {
      tiltLineIndex = i;
      break;
    }
    if (raw.startsWith('[') && raw.includes(']')) {
      const closing = raw.indexOf(']');
      const key = raw.slice(1, closing).trim();
      const value = raw.slice(closing + 1).trim();
      metadata[key] = value;
    }
  }
  if (tiltLineIndex === -1) throw new IESParseError('Missing TILT specification');

  const tiltSpec = lines[tiltLineIndex].toUpperCase().replace(/\s+/g, '');
  const tiltType = tiltSpec.split('=')[1] || 'NONE';
  if (tiltType !== 'NONE' && tiltType !== 'INCLUDE') {
    throw new IESParseError(`Unsupported TILT type: ${tiltType}`);
  }
  const tokens = tokenizeNumbers(lines.slice(tiltLineIndex + 1));
  const cursor = new NumberCursor(tokens);

  let tiltAngles: number[] = [];
  let tiltMultipliers: number[] = [];
  if (tiltType !== 'NONE') {
    const tiltCount = cursor.nextInt('tilt angle count');
    tiltAngles = cursor.nextNumbers(tiltCount, 'tilt angles');
    tiltMultipliers = cursor.nextNumbers(tiltCount, 'tilt multipliers');
  }

  const [
    lampCount,
    lumensPerLamp,
    candelaMultiplier,
    numVerticalAngles,
    numHorizontalAngles,
    photometricType,
    unitsType,
    width,
    length,
    height
  ] = cursor.nextNumbers(10, 'header');

  // Ballast/lamp factors and input watts: optional 3 numbers
  const remaining = cursor.remaining();
  const expectedCore =
    numVerticalAngles + numHorizontalAngles + numVerticalAngles * numHorizontalAngles;
  if (remaining >= expectedCore + 3) {
    cursor.skip(3);
  }

  const verticalAngles = cursor.nextNumbers(numVerticalAngles, 'vertical angles');
  const horizontalAngles = cursor.nextNumbers(numHorizontalAngles, 'horizontal angles');

  const candelaRaw = cursor.nextNumbers(numVerticalAngles * numHorizontalAngles, 'candelas');
  const candelas: number[][] = [];
  for (let h = 0; h < numHorizontalAngles; h += 1) {
    const start = h * numVerticalAngles;
    const slice = candelaRaw.slice(start, start + numVerticalAngles).map((v) => v * candelaMultiplier);
    candelas.push(applyTilt(slice, tiltAngles, tiltMultipliers));
  }

  if (!isMonotonic(verticalAngles) || !isMonotonic(horizontalAngles)) {
    throw new IESParseError('Angles must be monotonic increasing');
  }

  const totalLumens = lampCount * lumensPerLamp;
  const maxCandela = Math.max(...candelas.flat());

  return {
    photometry: {
      verticalAngles,
      horizontalAngles,
      candelas,
      metadata: {
        ...metadata,
        photometricType: photometricType.toString(),
        unitsType: unitsType === 1 ? 'meters' : 'feet',
        dimensions: `${width}x${length}x${height}`
      },
      totalLumens: lumensPerLamp > 0 ? lampCount * lumensPerLamp : undefined
    },
    totalLumens: lumensPerLamp > 0 ? lampCount * lumensPerLamp : maxCandela,
    maxCandela
  };
}

function applyTilt(candelas: number[], tiltAngles: number[], multipliers: number[]): number[] {
  if (!tiltAngles.length || tiltAngles.length !== multipliers.length) return candelas;
  if (candelas.length === multipliers.length) {
    return candelas.map((val, idx) => val * multipliers[idx]);
  }
  // fallback: apply first multiplier if counts differ
  const fallback = multipliers[0] ?? 1;
  return candelas.map((val) => val * fallback);
}

function tokenizeNumbers(lines: string[]): number[] {
  const tokens: number[] = [];
  lines.forEach((line) => {
    const matches = line.match(numberPattern) || [];
    matches.forEach((m) => tokens.push(Number(m)));
  });
  return tokens;
}

class NumberCursor {
  constructor(private tokens: number[], private idx = 0) {}

  nextNumbers(count: number, label: string): number[] {
    if (this.idx + count > this.tokens.length) {
      throw new IESParseError(`Expected ${count} values for ${label} but found ${this.tokens.length - this.idx}`);
    }
    const slice = this.tokens.slice(this.idx, this.idx + count);
    this.idx += count;
    return slice;
  }

  nextInt(label: string): number {
    const val = this.nextNumbers(1, label)[0];
    return Math.round(val);
  }

  skip(count: number) {
    this.nextNumbers(count, 'skip');
  }

  remaining() {
    return this.tokens.length - this.idx;
  }
}

function isMonotonic(arr: number[], epsilon = 1e-6): boolean {
  for (let i = 1; i < arr.length; i += 1) {
    if (arr[i] + epsilon < arr[i - 1]) return false;
  }
  return true;
}
