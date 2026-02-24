"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

const countries = [
  { value: "", label: "Tous les pays" },
  { value: "france", label: "France 🇫🇷" },
  { value: "allemagne", label: "Allemagne 🇩🇪" },
  { value: "royaume-uni", label: "Royaume-Uni 🇬🇧" },
  { value: "canada", label: "Canada 🇨🇦" },
  { value: "suisse", label: "Suisse 🇨🇭" },
  { value: "afrique", label: "Afrique 🌍" },
];

export function UniversitesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPays = searchParams.get("pays") || "";
  const currentQ = searchParams.get("q") || "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Rechercher une université, un pays, une filière…"
          defaultValue={currentQ}
          onChange={(e) => update("q", e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Country filter */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pays
        </p>
        <div className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <button
              key={c.value}
              onClick={() => update("pays", c.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                currentPays === c.value
                  ? "bg-[var(--primary)] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
