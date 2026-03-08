import type { JSX } from "react";

type Item = { label: string; path: string };

export default function BottomNav(props: {
  items: Item[];
  activeIndex: number;
  onChange: (index: number) => void;
  variant?: "top" | "bottom";
}): JSX.Element {
  const { items, activeIndex, onChange, variant = "bottom" } = props;
  const isTop = variant === "top";

  const icons: Record<string, string> = {
    Dashboard: "🏠",
    Workouts: "🏋️",
    Meals: "🍽️",
    Profile: "👤",
  };

  return (
    <nav className={isTop ? "topNav" : "bottomNav"} aria-label="Primary navigation">
      <div className="navBubbles">
        {items.map((item, idx) => {
          const active = idx === activeIndex;
          const icon = icons[item.label] ?? "•";
          return (
            <button
              key={item.path}
              className={`navBubble ${active ? "active" : ""}`}
              onClick={() => onChange(idx)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="navIcon">{icon}</span>
              <span className="srOnly navLabel">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
