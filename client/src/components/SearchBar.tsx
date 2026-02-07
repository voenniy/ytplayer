import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Search } from "lucide-react";
import { fetchSuggestions } from "@/lib/api";
import { useTranslation } from "@/i18n";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export function SearchBar({ onSearch, isLoading, initialQuery }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTypedRef = useRef(false);

  const loadSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const results = await fetchSuggestions(q);
    setSuggestions(results);
    if (inputRef.current === document.activeElement) {
      setOpen(results.length > 0);
    }
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (!userTypedRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadSuggestions(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, loadSuggestions]);

  const doSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    setSuggestions([]);
    onSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      setQuery(selected);
      doSearch(selected);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const highlightMatch = (text: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-foreground">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              userTypedRef.current = true;
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={t("search.placeholder")}
            className="flex-1"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </PopoverAnchor>
      <PopoverContent
        className="p-1 w-[var(--radix-popover-trigger-width)]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {suggestions.map((s, i) => (
          <button
            key={s}
            className={`w-full text-left text-sm px-3 py-1.5 rounded-sm cursor-pointer transition-colors ${
              i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery(s);
              doSearch(s);
              inputRef.current?.blur();
            }}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">{highlightMatch(s)}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
