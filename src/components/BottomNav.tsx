import type { JSX } from "react";

type Item = { label: string; path: string };

export default function BottomNav(props: {
  items: Item[];
  activeIndex: number;
  onChange: (index: number) => void;
}): JSX.Element {
  const { items, activeIndex, onChange } = props;

  return (
    <nav className="bottomNav" aria-label="Bottom navigation">
      {items.map((item, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={item.path}
            className={`navItem ${active ? "active" : ""}`}
            onClick={() => onChange(idx)}
            aria-current={active ? "page" : undefined}
          >
            <span className="navLabel">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
