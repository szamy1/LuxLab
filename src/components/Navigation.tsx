interface NavItem {
  id: string;
  label: string;
  description: string;
}

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
}

export function Navigation({ items, active, onSelect }: Props) {
  return (
    <nav className="space-y-2" aria-label="Sections">
      {items.map((item) => (
        <button
          key={item.id}
          className="w-full text-left tab-button"
          data-active={active === item.id}
          onClick={() => onSelect(item.id)}
        >
          <div className="font-semibold">{item.label}</div>
          <div className="text-sm text-text-muted">{item.description}</div>
        </button>
      ))}
    </nav>
  );
}
