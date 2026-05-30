"use client";

import { useEffect, useState } from "react";
import { Heart, Users } from "lucide-react";
import { formatEuro } from "@/lib/donate/constants";
import type { DonationStats } from "@/lib/donate/aggregate";

export function DonateProgress() {
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/donations/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: DonationStats) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Les statistiques de soutien seront bientôt visibles ici.
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-48 rounded bg-slate-100" />
        <div className="mt-4 h-3 w-full rounded-full bg-slate-100" />
        <div className="mt-4 h-16 rounded-xl bg-slate-50" />
      </div>
    );
  }

  const pct = stats.monthlyGoalCents
    ? Math.min(100, Math.round((stats.monthlyRaisedCents / stats.monthlyGoalCents) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--primary)]">
            Objectif du mois
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {formatEuro(stats.monthlyRaisedCents)}{" "}
            <span className="text-base font-normal text-slate-500">
              / {formatEuro(stats.monthlyGoalCents)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-[var(--orange)]" />
            {stats.monthlySupporterCount} ce mois
          </span>
          <span className="flex items-center gap-1.5">
            <Heart size={16} className="text-red-400" />
            {stats.totalSupporterCount} au total
          </span>
        </div>
      </div>

      <div
        className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l'objectif mensuel"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[var(--primary)] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{pct}% de l&apos;objectif atteint</p>

      {stats.recentSupporters.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
          {stats.recentSupporters.slice(0, 6).map((s, i) => (
            <li
              key={`${s.succeededAt}-${i}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div>
                <span className="font-medium text-slate-700">{s.displayName}</span>
                {s.publicMessage && (
                  <p className="text-xs text-slate-500 line-clamp-1">
                    « {s.publicMessage} »
                  </p>
                )}
              </div>
              <span className="shrink-0 text-slate-600">{formatEuro(s.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
