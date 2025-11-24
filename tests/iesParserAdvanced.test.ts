import { describe, expect, it } from 'vitest';
import { parseIES } from '../src/lib/iesParser';

const tiltIES = `IESNA:LM-63-2002
[TEST] Tilt include
TILT=INCLUDE
3
0 45 90
1 0.9 0.8
1 2000 1 3 1 1 1 0.3 1.2 0.1
0 45 90
0
500 400 300`;

describe('parseIES advanced', () => {
  it('parses TILT=INCLUDE and applies multipliers', () => {
    const result = parseIES(tiltIES);
    expect(result.totalLumens).toBe(2000);
    expect(result.photometry.verticalAngles).toEqual([0, 45, 90]);
    expect(result.photometry.horizontalAngles).toEqual([0]);
    expect(result.photometry.candelas[0][0]).toBeCloseTo(500); // multiplier 1
    expect(result.photometry.candelas[0][2]).toBeCloseTo(240); // 300 * 0.8
  });
});
