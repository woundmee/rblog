"use client";

import { useMemo, useState } from "react";
import { buildIconSvg, iconColorOptions, iconLibrary, type IconColor } from "@/lib/icon-library";

type IconPickerProps = {
  onInsert: (token: string) => void;
  className?: string;
};

export default function IconPicker({ onInsert, className }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<IconColor>("default");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return iconLibrary;
    }
    return iconLibrary.filter(
      (icon) => icon.label.toLowerCase().includes(normalized) || icon.id.toLowerCase().includes(normalized)
    );
  }, [query]);

  const handleInsert = (iconId: string) => {
    const token = color === "default" ? `{{icon:${iconId}}}` : `{{icon:${iconId}:${color}}}`;
    onInsert(token);
  };

  return (
    <section className={className ? className : "panel icon-picker-panel-inline"}>
      <div className="icon-picker-controls">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск иконок"
          aria-label="Поиск иконок"
        />
        <select value={color} onChange={(event) => setColor(event.target.value as IconColor)} aria-label="Цвет иконки">
          {iconColorOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="icon-picker-grid">
        {filtered.length === 0 ? (
          <p className="icon-picker-empty">Ничего не найдено.</p>
        ) : (
          filtered.map((icon) => (
            <button key={icon.id} type="button" className="icon-picker-item" onClick={() => handleInsert(icon.id)}>
              <span
                className={`icon-picker-preview${color !== "default" ? ` md-icon-color-${color}` : ""}`}
                dangerouslySetInnerHTML={{ __html: buildIconSvg(icon, "icon-picker-svg", icon.label) }}
              />
              <span>{icon.label}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
