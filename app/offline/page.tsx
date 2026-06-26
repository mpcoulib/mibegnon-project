import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-4 text-2xl font-bold text-[var(--primary)]">
        Pas de connexion
      </h1>
      <p className="mt-2 max-w-sm text-slate-600">
        Tu es hors ligne. Certaines pages déjà visitées peuvent encore s&apos;afficher.
        Réessaie quand le réseau revient — ça va aller !
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
