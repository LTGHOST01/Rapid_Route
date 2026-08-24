import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { filterCatalog, geocodeAddress, type PickedPlace } from "../../lib/places";
import { inputClass } from "../ui";
import { cn } from "../../lib/cn";

type CatalogItem = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  area?: string;
};

type Props = {
  value: string;
  placeholder: string;
  suggestions: CatalogItem[];
  onSelect: (place: PickedPlace) => void;
};

export function PlaceSearch({ value, placeholder, suggestions, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  const localHits = useMemo(() => filterCatalog(suggestions, query), [suggestions, query]);

  async function commitTyped() {
    const text = query.trim();
    if (!text) return;
    const exact = suggestions.find((item) => item.label.toLowerCase() === text.toLowerCase());
    if (exact) {
      onSelect({ label: exact.label, lat: exact.lat, lng: exact.lng });
      setOpen(false);
      return;
    }
    setBusy(true);
    const hit = await geocodeAddress(text);
    setBusy(false);
    if (hit) {
      onSelect(hit);
      setQuery(hit.label);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-muted" />
      <input
        className={cn(inputClass(), "pl-8")}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commitTyped();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 140);
        }}
      />
      {open && (localHits.length > 0 || query.trim()) && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
          {localHits.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full flex-col px-3 py-1.5 text-left hover:bg-soft"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect({ label: item.label, lat: item.lat, lng: item.lng });
                  setQuery(item.label);
                  setOpen(false);
                }}
              >
                <span className="text-[13px]">{item.label}</span>
                {item.area && <span className="text-[11px] text-muted">{item.area}</span>}
              </button>
            </li>
          ))}
          {query.trim() && (
            <li>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-[12px] text-nav hover:bg-soft"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void commitTyped()}
              >
                {busy ? "Searching Mumbai…" : `Search “${query.trim()}” in Mumbai`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
