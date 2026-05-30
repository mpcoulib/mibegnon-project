import { getScholarshipsForChaoContext } from "@/lib/data/scholarships";

export async function buildScholarshipsContext(): Promise<string> {
  try {
    const rows = await getScholarshipsForChaoContext();

    if (rows.length === 0) {
      return "Aucune bourse en base pour le moment. Oriente l'utilisateur vers /bourses pour explorer.";
    }

    const lines = rows.map((s) => {
      const deadline = s.deadline
        ? new Date(s.deadline).toLocaleDateString("fr-FR")
        : "non précisée";
      const levels = s.academicLevels.join(", ") || "tous niveaux";
      const funding = s.isFullFunding ? "entièrement financée" : "bourse partielle";
      return `- ${s.name} (${s.country}, ${s.provider}) — ${funding}, niveaux: ${levels}, deadline: ${deadline} → /bourses/${s.id}`;
    });

    return `Bourses actuellement sur Mibegnon (cite-les quand c'est pertinent) :\n${lines.join("\n")}`;
  } catch {
    return "Catalogue bourses temporairement indisponible. Oriente vers /bourses sur le site.";
  }
}
