import { describe, expect, it } from 'vitest';
import { parseIES } from '../src/lib/iesParser';

const sampleIES = `IESNA:LM-63-2002
[TEST] Sample
TILT=NONE
1 3000 1 3 2 1 1 0.3 0.8 0.2
0 45 90
0 90
100 50 10
120 60 15`;

describe('parseIES', () => {
  it('parses photometry counts and lumens', () => {
    const result = parseIES(sampleIES);
    expect(result.totalLumens).toBe(3000);
    expect(result.photometry.verticalAngles).toHaveLength(3);
    expect(result.photometry.horizontalAngles).toHaveLength(2);
    expect(result.photometry.candelas).toHaveLength(2);
    expect(result.photometry.candelas[0][0]).toBe(100);
    expect(result.photometry.candelas[1][2]).toBe(15);
  });

  it('throws on unsupported tilt', () => {
    const invalid = sampleIES.replace('TILT=NONE', 'TILT=BOGUS');
    expect(() => parseIES(invalid)).toThrowError();
  });
});
