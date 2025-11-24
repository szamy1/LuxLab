import narrowBeam from '../assets/demo/narrow-beam.ies?raw';
import symmetricSoft from '../assets/demo/symmetric-soft.ies?raw';
import wideBatwing from '../assets/demo/wide-batwing.ies?raw';
import { parseIES } from './iesParser';
import { LuminaireConfig } from '../types/lighting';

interface DemoEntry {
  id: string;
  name: string;
  description: string;
  raw: string;
}

const demoEntries: DemoEntry[] = [
  {
    id: 'wide-batwing',
    name: 'Wide Batwing',
    description: 'Soft batwing distribution suited for open offices.',
    raw: wideBatwing
  },
  {
    id: 'narrow-beam',
    name: 'Narrow Beam',
    description: 'Punchy spot for accenting surfaces or corridors.',
    raw: narrowBeam
  },
  {
    id: 'symmetric-soft',
    name: 'Symmetric Soft',
    description: 'Balanced distribution for general ambient lighting.',
    raw: symmetricSoft
  }
];

export function loadDemoLuminaires(): LuminaireConfig[] {
  return demoEntries.map((entry) => {
    const parsed = parseIES(entry.raw);
    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      lumens: parsed.totalLumens,
      photometry: parsed.photometry
    };
  });
}
