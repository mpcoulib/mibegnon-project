"use client";

import { useTransition } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApplication } from "@/lib/actions/applications";

export function ApplyButton({ scholarshipId }: { scholarshipId: string }) {
  const [isPending, start] = useTransition();

  function handleSubmit() {
    start(() => createApplication(scholarshipId));
  }

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={handleSubmit}
      className="w-full bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90"
    >
      <ClipboardList size={14} className="mr-2" />
      {isPending ? "Enregistrement…" : "Suivre sur Mibegnon"}
    </Button>
  );
}
