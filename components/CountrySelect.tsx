"use client";

import { useState, useRef, useEffect } from "react";
import { COUNTRIES } from "@/lib/constants/countries";

export default function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = (
    query.trim() ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())) : COUNTRIES
  ).slice(0, 8);

  const handleSelect = (name: string) => {
    onChange(name);
    setQuery(name);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search for your country..."
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-[#1A0B36] border border-white/10 rounded-lg shadow-xl">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.name)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-100 hover:bg-white/10 text-left"
            >
              {/* Real flag image (flagcdn.com) instead of a Unicode emoji —
                  emoji flags depend on the OS having the right font, which
                  Windows often doesn't, and fall back to showing the raw
                  two-letter code instead of a flag. An image renders
                  identically everywhere. */}
              <img
                src={`https://flagcdn.com/24x18/${c.code.toLowerCase()}.png`}
                alt=""
                width={20}
                height={15}
                className="rounded-sm flex-shrink-0"
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
