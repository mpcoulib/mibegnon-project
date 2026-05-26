import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidaturesBoard } from "@/components/candidatures-board";
import { getApplications } from "@/lib/actions/applications";

export default async function CandidaturesPage() {
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Mes candidatures</h1>
        <p className="mt-1 text-sm text-slate-500">
          {applications.length === 0
            ? "Suis la progression de tes candidatures."
            : `${applications.length} candidature${applications.length > 1 ? "s" : ""} en cours de suivi.`}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ClipboardList size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-600">Pas encore de candidature dêh</p>
          <p className="mt-1 text-sm text-slate-400">
            Clique sur &quot;Suivre sur Mibegnon&quot; sur une fiche bourse pour commencer le suivi.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-5 bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            <Link href="/bourses">Trouver une bourse</Link>
          </Button>
        </div>
      ) : (
        <CandidaturesBoard applications={applications} />
      )}
    </div>
  );
}
