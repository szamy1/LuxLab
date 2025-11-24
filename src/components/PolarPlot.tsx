import { useMemo } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { PhotometryData } from '../types/lighting';

interface PolarPlotProps {
  photometry: PhotometryData;
  title?: string;
}

/**
 * Polar intensity plot using Recharts (well-maintained and open source).
 * Shows the nearest C-plane to 0° mirrored across 360° for a full beam visual.
 */
export function PolarPlot({ photometry, title = 'Polar Intensity' }: PolarPlotProps) {
  const planeIndex = findPlaneIndex(photometry.horizontalAngles, 0);
  const slice = photometry.candelas[planeIndex] || [];
  const max = Math.max(...slice, 1);

  const data = useMemo(() => {
    const mirrored: { angle: number; intensity: number }[] = [];
    photometry.verticalAngles.forEach((angle, idx) => {
      const val = slice[idx] ?? 0;
      mirrored.push({ angle, intensity: val });
      if (angle !== 0 && angle !== 180) {
        mirrored.push({ angle: 360 - angle, intensity: val });
      }
    });
    return mirrored.sort((a, b) => a.angle - b.angle);
  }, [photometry.verticalAngles, slice]);

  if (!data.length) {
    return (
      <div data-card className="p-4 text-sm text-text-muted">
        Polar plot unavailable (missing photometry slice).
      </div>
    );
  }

  return (
    <div data-card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="helper-text">
            C-plane {photometry.horizontalAngles[planeIndex]}° · Peak {max.toFixed(0)} cd
          </p>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(128,140,160,0.4)" />
            <PolarAngleAxis dataKey="angle" tick={{ fill: 'currentColor', fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, max]} tick={{ fill: 'currentColor', fontSize: 10 }} />
            <Radar
              name="Intensity"
              dataKey="intensity"
              stroke="rgb(var(--color-accent))"
              fill="rgb(var(--color-accent-soft))"
              fillOpacity={0.55}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(0)} cd`}
              labelFormatter={(label: number) => `${label}°`}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function findPlaneIndex(planes: number[], desired: number) {
  if (!planes.length) return 0;
  let closest = 0;
  let delta = Math.abs(planes[0] - desired);
  planes.forEach((angle, idx) => {
    const diff = Math.abs(angle - desired);
    if (diff < delta) {
      delta = diff;
      closest = idx;
    }
  });
  return closest;
}
