import { useTheme } from '../theme/ThemeProvider';

export function Header() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-accent text-text-inverted flex items-center justify-center font-bold text-lg shadow-lg">
            LX
          </div>
          <div>
            <div className="text-xl font-semibold">LuxLab</div>
            <div className="text-sm text-text-muted">Fast web photometry & room lighting sandbox.</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-text-muted" htmlFor="theme-select">
            Theme
          </label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="border border-border-subtle bg-surface px-3 py-2 text-sm rounded-md"
          >
            {themes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
