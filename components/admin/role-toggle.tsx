"use client";

import { useState, useTransition } from "react";
import { UserRole } from "@prisma/client";
import { setUserRole } from "@/lib/actions/coaching-ops";

export function RoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isAdmin = role === UserRole.ADMIN;

  function toggle() {
    const next = isAdmin ? UserRole.STUDENT : UserRole.ADMIN;
    if (
      !window.confirm(
        isAdmin ? "Retirer le rôle admin à cet utilisateur ?" : "Donner le rôle admin à cet utilisateur ?",
      )
    )
      return;
    setError(null);
    start(async () => {
      const res = await setUserRole(userId, next);
      if (!res.success) setError(res.error);
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={toggle}
        disabled={pending || isSelf}
        title={isSelf ? "Tu ne peux pas modifier ton propre rôle" : undefined}
        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isAdmin
            ? "border-red-200 text-red-700 hover:bg-red-50"
            : "border-slate-200 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {isAdmin ? "Retirer admin" : "Rendre admin"}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
