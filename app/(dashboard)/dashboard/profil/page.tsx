import { EducationLevel } from "@prisma/client";
import { User, Mail, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUser, getAuthUser } from "@/lib/actions/user";
import { updateProfile } from "./actions";

const educationLabels: Record<EducationLevel, string> = {
  TROISIEME: "3ème",
  SECONDE: "2nde",
  PREMIERE: "1ère",
  TERMINALE: "Terminale",
  BAC_PLUS_1: "Bac+1",
  BAC_PLUS_2: "Bac+2",
};

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const authUser = await getAuthUser();

  if (!authUser) {
    return (
      <p className="text-sm text-slate-500">Connecte-toi pour voir ton profil.</p>
    );
  }

  await ensurePrismaUser();
  const profile = await prisma.user.findUnique({ where: { id: authUser.id } });

  const fullName =
    profile?.fullName ??
    (authUser.user_metadata?.full_name as string | undefined) ??
    "—";
  const email = profile?.email ?? authUser.email ?? "—";
  const createdAt = authUser.created_at
    ? new Date(authUser.created_at).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
  const initials =
    fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)]">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Mets à jour tes informations pour de meilleures recommandations.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {decodeURIComponent(success)}
        </div>
      )}

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--primary)] text-white text-xl font-bold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{fullName}</p>
              <p className="text-sm text-slate-500">Élève ivoirien 🇨🇮</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Adresse email</p>
              <p className="text-sm font-medium text-slate-700">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Membre depuis</p>
              <p className="text-sm font-medium text-slate-700">{createdAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-[var(--primary)] mb-4 flex items-center gap-2">
            <User size={18} />
            Modifier mon profil
          </h2>

          <form action={updateProfile} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={profile?.fullName ?? fullName}
                required
                className="mt-1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile?.phone ?? ""}
                  placeholder="+225 07 00 00 00 00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={profile?.city ?? ""}
                  placeholder="Abidjan"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="educationLevel">Niveau d&apos;études</Label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  defaultValue={profile?.educationLevel ?? ""}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {Object.entries(educationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="gpa">Moyenne (GPA)</Label>
                <Input
                  id="gpa"
                  name="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  defaultValue={profile?.gpa ?? ""}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fieldOfStudy">Filière</Label>
              <Input
                id="fieldOfStudy"
                name="fieldOfStudy"
                defaultValue={profile?.fieldOfStudy ?? ""}
                placeholder="Informatique, Médecine…"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="targetCountries">Pays cibles (séparés par des virgules)</Label>
              <Input
                id="targetCountries"
                name="targetCountries"
                defaultValue={profile?.targetCountries?.join(", ") ?? ""}
                placeholder="France, Canada, Allemagne"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="targetFields">Domaines cibles (séparés par des virgules)</Label>
              <Input
                id="targetFields"
                name="targetFields"
                defaultValue={profile?.targetFields?.join(", ") ?? ""}
                placeholder="Ingénierie, Santé"
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
            >
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
