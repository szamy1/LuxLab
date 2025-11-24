import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Heatmap } from './components/Heatmap';
import { LayoutSchematic } from './components/LayoutSchematic';
import { MetricCard } from './components/MetricCard';
import { Navigation } from './components/Navigation';
import { NumberField } from './components/NumberField';
import { PolarPlot } from './components/PolarPlot';
import { useLocalStorage } from './hooks/useLocalStorage';
import { loadDemoLuminaires } from './lib/demoData';
import { parseIES } from './lib/iesParser';
import { calculateIlluminanceGrid, calculateRCR } from './lib/photometryEngine';
import { CalculationResult, LayoutConfig, LuminaireConfig, RoomConfig } from './types/lighting';
import { createLuminairePositions } from './lib/photometryEngine';

const demoLibrary = loadDemoLuminaires();
const navItems = [
  { id: 'getting-started', label: 'Getting Started', description: 'Run a guided demo' },
  { id: 'luminaire', label: 'Luminaire', description: 'Choose or upload IES' },
  { id: 'room', label: 'Room', description: 'Define dimensions' },
  { id: 'layout', label: 'Layout', description: 'Grid & spacing' },
  { id: 'results', label: 'Results', description: 'Metrics & heatmap' }
];

const defaultRoom = (): RoomConfig => ({
  length: 6,
  width: 4,
  height: 3,
  mountingHeight: 2.7,
  workplaneHeight: 0.8,
  reflectances: { ceiling: 0.8, walls: 0.5, floor: 0.2 }
});

const defaultLayout = (room: RoomConfig): LayoutConfig => {
  const rows = 2; // along width (Y)
  const columns = 3; // along length (X)
  const rowSpacing = Number((room.width / (rows + 1)).toFixed(2));
  const columnSpacing = Number((room.length / (columns + 1)).toFixed(2));
  const offsetX = Number(((room.length - (columns - 1) * columnSpacing) / 2).toFixed(2));
  const offsetY = Number(((room.width - (rows - 1) * rowSpacing) / 2).toFixed(2));
  return { rows, columns, rowSpacing, columnSpacing, offsetX, offsetY };
};

function App() {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [room, setRoom] = useLocalStorage<RoomConfig>('luxlab-room', defaultRoom());
  const [layout, setLayout] = useLocalStorage<LayoutConfig>('luxlab-layout', defaultLayout(defaultRoom()));
  const [centerLayout, setCenterLayout] = useState<boolean>(true);
  const [reflectanceMode, setReflectanceMode] = useState<'light' | 'medium' | 'dark' | 'custom'>(
    'light'
  );
  const [gridResolution, setGridResolution] = useLocalStorage<number>('luxlab-grid', 28);
  const [samplesPerPoint, setSamplesPerPoint] = useLocalStorage<number>('luxlab-samples', 1);
  const [luminaires, setLuminaires] = useState<LuminaireConfig[]>(demoLibrary);
  const [selectedLuminaireId, setSelectedLuminaireId] = useState<string>(demoLibrary[0]?.id ?? '');
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const luminairePositions = useMemo(
    () => createLuminairePositions(room, layout),
    [room, layout]
  );

  const selectedLuminaire = useMemo(
    () => luminaires.find((lum) => lum.id === selectedLuminaireId),
    [luminaires, selectedLuminaireId]
  );

  useEffect(() => {
    if (!selectedLuminaire) return;
    const timer = window.setTimeout(() => {
      const result = calculateIlluminanceGrid(
        room,
        layout,
        selectedLuminaire.photometry,
        gridResolution,
        samplesPerPoint
      );
      setCalcResult(result);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [room, layout, selectedLuminaire, gridResolution, samplesPerPoint]);

  const handleIESUpload = async (file: File) => {
    setStatus(null);
    setError(null);
    const text = await file.text();
    try {
      const parsed = parseIES(text);
      const newLuminaire: LuminaireConfig = {
        id: `upload-${Date.now()}`,
        name: file.name.replace(/\.ies$/i, ''),
        description: 'Uploaded IES file',
        lumens: parsed.totalLumens,
        photometry: parsed.photometry
      };
      setLuminaires((prev) => [newLuminaire, ...prev]);
      setSelectedLuminaireId(newLuminaire.id);
      setStatus(`Loaded ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse IES file');
    }
  };

  const runDemoScenario = () => {
    const freshRoom = defaultRoom();
    setRoom(freshRoom);
    setLayout(defaultLayout(freshRoom));
    setSelectedLuminaireId(luminaires[0]?.id ?? '');
    setActiveSection('results');
    setStatus('Demo scenario loaded. Adjust any parameter to see updates.');
  };

  const applyReflectance = (preset: 'light' | 'medium' | 'dark') => {
    setReflectanceMode(preset);
    const presets = {
      light: { ceiling: 0.8, walls: 0.5, floor: 0.2 },
      medium: { ceiling: 0.7, walls: 0.5, floor: 0.3 },
      dark: { ceiling: 0.5, walls: 0.3, floor: 0.1 }
    } as const;
    setRoom((prev) => ({ ...prev, reflectances: presets[preset] }));
  };

  const suggestedSpacing = useMemo(() => {
    const mounting = Math.max(room.mountingHeight - room.workplaneHeight, 1);
    const spacingCriterion = 1.3;
    const spacing = Number((mounting * spacingCriterion).toFixed(2));
    return {
      rowSpacing: Math.min(spacing, room.width / Math.max(layout.rows, 1)),
      columnSpacing: Math.min(spacing, room.length / Math.max(layout.columns, 1))
    };
  }, [room, layout.rows, layout.columns]);
  const gridSpacing = useMemo(() => {
    const denom = Math.max(gridResolution, 1);
    return {
      length: Number((room.length / denom).toFixed(2)),
      width: Number((room.width / denom).toFixed(2))
    };
  }, [gridResolution, room.length, room.width]);

  const handleApplySuggestion = () => {
    setLayout((prev) => ({
      ...prev,
      rowSpacing: Number(suggestedSpacing.rowSpacing.toFixed(2)),
      columnSpacing: Number(suggestedSpacing.columnSpacing.toFixed(2))
    }));
  };

  useEffect(() => {
    if (!centerLayout) return;
    setLayout((prev) => ({
      ...prev,
      ...computeCenteredOffsets(room, prev)
    }));
  }, [
    centerLayout,
    room.length,
    room.width,
    layout.rows,
    layout.columns,
    layout.rowSpacing,
    layout.columnSpacing,
    setLayout
  ]);

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Header />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <div>
          <Navigation items={navItems} active={activeSection} onSelect={setActiveSection} />
          <div className="mt-4 text-sm text-text-muted">
            Changes auto-calc results in real time. Theme and preferences auto-save locally.
          </div>
        </div>

        <main className="space-y-6">
          {status ? (
            <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          {activeSection === 'getting-started' && (
            <section className="space-y-4 fade-in">
              <div data-card className="p-5 space-y-3">
                <h2 className="text-2xl font-semibold">Welcome to LuxLab</h2>
                <p className="text-text-muted">
                  Web-based photometry and room lighting sandbox. Load a demo setup instantly, tweak a
                  few fields, and review the heatmap plus metrics without extra clicks.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button className="button-primary" onClick={runDemoScenario}>Run Demo Scenario</button>
                  <button className="button-secondary" onClick={() => setActiveSection('luminaire')}>
                    Jump to Luminaire
                  </button>
                </div>
              </div>
              <div className="section-grid">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <div data-card className="p-4" key={step}>
                    <div className="text-xs uppercase tracking-wide text-text-muted">Step {step}</div>
                    <p className="font-semibold">
                      {getTutorialStep(step).title}
                    </p>
                    <p className="text-sm text-text-muted">{getTutorialStep(step).text}</p>
                  </div>
                ))}
              </div>
              <div data-card className="p-4">
                <p className="text-sm text-text-muted">
                  Tips: Use Blueprint or Dark themes when focusing on heatmaps. MVP uses direct lighting
                  only; reflections and glare are approximate.
                </p>
              </div>
            </section>
          )}

          {activeSection === 'luminaire' && selectedLuminaire && (
            <section className="space-y-4 fade-in">
              <div className="section-grid">
                <div data-card className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">Choose Demo Luminaire</h3>
                    <p className="helper-text">Auto-parses built-in IES files.</p>
                  </div>
                  <select
                    className="w-full border border-border-subtle bg-surface px-3 py-2 rounded-md"
                    value={selectedLuminaireId}
                    onChange={(event) => setSelectedLuminaireId(event.target.value)}
                  >
                    {luminaires.map((luminaire) => (
                      <option key={luminaire.id} value={luminaire.id}>
                        {luminaire.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-text-muted">
                    {selectedLuminaire?.description || 'Demo photometry ready to preview.'}
                  </p>
                </div>

                <div data-card className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">Upload IES</h3>
                    <p className="helper-text">Uploads stay in your browser.</p>
                  </div>
                  <input
                    type="file"
                    accept=".ies,.IES"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleIESUpload(file);
                    }}
                  />
                  <p className="helper-text">
                    Supports IES LM-63 with TILT=NONE. Clear messaging if parsing fails.
                  </p>
                </div>

                <div data-card className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold">Photometry Snapshot</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <MetricCard
                      label="Total lumens"
                      value={`${selectedLuminaire.photometry.totalLumens ?? selectedLuminaire.lumens} lm`}
                    />
                    <MetricCard label="Max candela" value={`${findMaxCandela(selectedLuminaire)} cd`} />
                    <MetricCard
                      label="Vertical angles"
                      value={`${selectedLuminaire.photometry.verticalAngles.length}`}
                      hint="Samples"
                    />
                    <MetricCard
                      label="Horizontal angles"
                      value={`${selectedLuminaire.photometry.horizontalAngles.length}`}
                      hint="Planes"
                    />
                  </div>
                </div>

                <PolarPlot photometry={selectedLuminaire.photometry} />
              </div>
            </section>
          )}

          {activeSection === 'room' && (
            <section className="space-y-4 fade-in">
                <div data-card className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Room setup</h3>
                    <p className="helper-text">Metric units with smart defaults. RCR is informational.</p>
                  </div>
                <div className="section-grid">
                  <NumberField
                    id="length"
                    label="Length"
                    value={room.length}
                    min={1}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => setRoom((prev) => ({ ...prev, length: value }))}
                  />
                  <NumberField
                    id="width"
                    label="Width"
                    value={room.width}
                    min={1}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => setRoom((prev) => ({ ...prev, width: value }))}
                  />
                  <NumberField
                    id="height"
                    label="Height"
                    value={room.height}
                    min={2}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => setRoom((prev) => ({ ...prev, height: value }))}
                  />
                  <NumberField
                    id="mounting"
                    label="Mounting height"
                    value={room.mountingHeight}
                    min={0.5}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => setRoom((prev) => ({ ...prev, mountingHeight: value }))}
                    helper="Distance from floor to luminaire"
                  />
                  <NumberField
                    id="workplane"
                    label="Workplane height"
                    value={room.workplaneHeight}
                    min={0}
                    step={0.1}
                    suffix="m"
                    onChange={(value) => setRoom((prev) => ({ ...prev, workplaneHeight: value }))}
                    helper="Typical desk height ~0.8m"
                  />
                </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="text-sm font-semibold">Reflectances:</div>
                    {['light', 'medium', 'dark'].map((preset) => (
                      <button
                        key={preset}
                        className="button-secondary"
                        data-active={reflectanceMode === preset}
                        onClick={() => applyReflectance(preset as 'light' | 'medium' | 'dark')}
                      >
                        {preset[0].toUpperCase() + preset.slice(1)} surfaces
                      </button>
                    ))}
                    <button
                      className="button-secondary"
                      data-active={reflectanceMode === 'custom'}
                      onClick={() => setReflectanceMode('custom')}
                    >
                      Custom
                    </button>
                    <div className="text-sm text-text-muted">
                      Ceiling {room.reflectances.ceiling}, walls {room.reflectances.walls}, floor{' '}
                      {room.reflectances.floor}
                    </div>
                  </div>
                  {reflectanceMode === 'custom' && (
                    <div className="section-grid">
                      <NumberField
                        id="ceiling-reflectance"
                        label="Ceiling reflectance"
                        value={room.reflectances.ceiling}
                        min={0}
                        step={0.05}
                        onChange={(value) =>
                          setRoom((prev) => ({
                            ...prev,
                            reflectances: { ...prev.reflectances, ceiling: clampFraction(value) }
                          }))
                        }
                        helper="0–1"
                      />
                      <NumberField
                        id="wall-reflectance"
                        label="Wall reflectance"
                        value={room.reflectances.walls}
                        min={0}
                        step={0.05}
                        onChange={(value) =>
                          setRoom((prev) => ({
                            ...prev,
                            reflectances: { ...prev.reflectances, walls: clampFraction(value) }
                          }))
                        }
                        helper="0–1"
                      />
                      <NumberField
                        id="floor-reflectance"
                        label="Floor reflectance"
                        value={room.reflectances.floor}
                        min={0}
                        step={0.05}
                        onChange={(value) =>
                          setRoom((prev) => ({
                            ...prev,
                            reflectances: { ...prev.reflectances, floor: clampFraction(value) }
                          }))
                        }
                        helper="0–1"
                      />
                    </div>
                  )}
                  <div className="text-sm text-text-muted">Room cavity ratio: {calculateRCR(room)}</div>
                </div>
              </section>
            )}

          {activeSection === 'layout' && (
            <section className="space-y-4 fade-in">
              <div className="section-grid">
                <div data-card className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">Grid layout</h3>
                    <p className="helper-text">Rows run along room width; columns along room length.</p>
                  </div>
                  <div className="section-grid">
                    <NumberField
                      id="rows"
                      label="Rows"
                      value={layout.rows}
                      min={1}
                      step={1}
                      onChange={(value) =>
                        setLayout((prev) => ({
                          ...prev,
                          rows: value,
                          rowSpacing: Math.max(prev.rowSpacing, 0.5)
                        }))
                      }
                    />
                    <NumberField
                      id="cols"
                      label="Columns"
                      value={layout.columns}
                      min={1}
                      step={1}
                      onChange={(value) =>
                        setLayout((prev) => ({
                          ...prev,
                          columns: value,
                          columnSpacing: Math.max(prev.columnSpacing, 0.5)
                        }))
                      }
                    />
                    <NumberField
                      id="row-spacing"
                      label="Row spacing (width axis)"
                      value={layout.rowSpacing}
                      min={0.1}
                      step={0.1}
                      suffix="m"
                      onChange={(value) => setLayout((prev) => ({ ...prev, rowSpacing: value }))}
                    />
                    <NumberField
                      id="col-spacing"
                      label="Column spacing (length axis)"
                      value={layout.columnSpacing}
                      min={0.1}
                      step={0.1}
                      suffix="m"
                      onChange={(value) => setLayout((prev) => ({ ...prev, columnSpacing: value }))}
                    />
                    <NumberField
                      id="offset-x"
                      label="Offset X (length axis)"
                      value={layout.offsetX}
                      min={0}
                      step={0.1}
                      suffix="m"
                      onChange={(value) => {
                        setCenterLayout(false);
                        setLayout((prev) => ({ ...prev, offsetX: value }));
                      }}
                      helper="Distance from length origin"
                    />
                    <NumberField
                      id="offset-y"
                      label="Offset Y (width axis)"
                      value={layout.offsetY}
                      min={0}
                      step={0.1}
                      suffix="m"
                      onChange={(value) => {
                        setCenterLayout(false);
                        setLayout((prev) => ({ ...prev, offsetY: value }));
                      }}
                      helper="Distance from width origin"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-text-muted">
                      Suggested spacing ~{suggestedSpacing.rowSpacing}m (rows/width) x{' '}
                      {suggestedSpacing.columnSpacing}m (columns/length)
                    </div>
                    <button className="button-secondary" onClick={handleApplySuggestion}>
                      Apply suggestion
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => setCenterLayout(true)}
                      title="Center the grid within the room bounds"
                    >
                      Center layout
                    </button>
                  </div>
                </div>

                <LayoutSchematic room={room} layout={layout} />
              </div>
            </section>
          )}

          {activeSection === 'results' && selectedLuminaire && calcResult && (
            <section className="space-y-4 fade-in">
              <div data-card className="p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Resolution & Accuracy</h3>
                    <p className="helper-text">
                      Increase grid density or sampling for smoother heatmaps. Higher values cost more
                      CPU.
                    </p>
                  </div>
                  <div className="text-sm text-text-muted">
                    {gridResolution} x {gridResolution} points
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="grid-resolution">Grid resolution</label>
                  <input
                    id="grid-resolution"
                    type="range"
                    min={8}
                    max={80}
                    value={gridResolution}
                    onChange={(event) => setGridResolution(Number(event.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex flex-wrap items-center justify-between text-sm text-text-muted">
                    <span>Coarse</span>
                    <span>
                      ~{gridSpacing.length}m (length) x {gridSpacing.width}m (width) between points
                    </span>
                    <span>Fine</span>
                  </div>
                </div>
                <div className="section-grid">
                  <div className="space-y-2">
                    <label htmlFor="samples-per-point">Sampling quality</label>
                    <select
                      id="samples-per-point"
                      value={samplesPerPoint}
                      onChange={(event) => setSamplesPerPoint(Number(event.target.value))}
                      className="w-full border border-border-subtle bg-surface px-3 py-2 rounded-md"
                    >
                      <option value={1}>Standard (1x)</option>
                      <option value={2}>High (2x)</option>
                      <option value={3}>Very High (3x)</option>
                      <option value={4}>Ultra (4x)</option>
                    </select>
                    <p className="helper-text">
                      Supersamples each grid point to reduce aliasing on the heatmap.
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface-muted p-3 text-sm text-text-muted">
                    Tip: Use zoom/pan on the heatmap to inspect focal areas. Higher sampling is most
                    noticeable with narrow beams or tight spacing.
                  </div>
                </div>
              </div>

              <div className="section-grid">
                <MetricCard label="Average illuminance" value={`${calcResult.average.toFixed(1)} lux`} />
                <MetricCard label="Minimum illuminance" value={`${calcResult.min.toFixed(1)} lux`} />
                <MetricCard label="Maximum illuminance" value={`${calcResult.max.toFixed(1)} lux`} />
                <MetricCard
                  label="Uniformity (min/avg)"
                  value={`${(calcResult.uniformity * 100).toFixed(1)} %`}
                  hint={calcResult.uniformity > 0.8 ? 'Good uniformity' : 'Consider tighter spacing'}
                />
              </div>

              <Heatmap
                grid={calcResult.grid}
                room={{ length: room.length, width: room.width }}
                resolution={gridResolution}
                spacing={gridSpacing}
                luminairePositions={luminairePositions}
              />
            </section>
          )}
          {activeSection === 'results' && (!selectedLuminaire || !calcResult) && (
            <div data-card className="p-5 text-sm text-text-muted">
              Results will appear once a luminaire and configuration are ready.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function findMaxCandela(luminaire: LuminaireConfig) {
  return Math.max(...luminaire.photometry.candelas.flat()).toFixed(0);
}

function getTutorialStep(step: number) {
  const steps = {
    1: {
      title: 'Open LuxLab and Run the Demo',
      text: "Use the Getting Started card and load a ready-made office scene for instant results."
    },
    2: {
      title: 'Choose a Luminaire',
      text: 'Select from demo optics or upload your own IES. Key metrics show immediately.'
    },
    3: {
      title: 'Define the Room',
      text: 'Set length, width, height, mounting and workplane heights. Reflectance presets help.'
    },
    4: {
      title: 'Configure the Layout',
      text: 'Pick rows and columns, adjust spacing, and view the schematic for positions.'
    },
    5: {
      title: 'View the Results',
      text: 'Metrics and heatmap update automatically with each change.'
    },
    6: {
      title: 'Iterate Quickly',
      text: 'Try new spacing, optics, or room sizes and watch the grid respond.'
    }
  } as const;
  return steps[step as keyof typeof steps];
}

function computeCenteredOffsets(room: RoomConfig, layout: LayoutConfig) {
  const totalLength = (layout.columns - 1) * layout.columnSpacing;
  const totalWidth = (layout.rows - 1) * layout.rowSpacing;
  const offsetX = Number(((room.length - totalLength) / 2).toFixed(2));
  const offsetY = Number(((room.width - totalWidth) / 2).toFixed(2));
  return { offsetX, offsetY };
}

function clampFraction(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export default App;
