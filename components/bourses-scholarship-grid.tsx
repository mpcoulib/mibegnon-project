import { ScholarshipCard } from "@/components/scholarship-card";
import { SavedScholarshipIdsProvider } from "@/components/saved-scholarship-context";
import type { ScholarshipListItem } from "@/lib/data/scholarships";

export function BoursesScholarshipGrid({
  scholarships,
}: {
  scholarships: ScholarshipListItem[];
}) {
  return (
    <SavedScholarshipIdsProvider>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {scholarships.map((s) => (
          <ScholarshipCard key={s.id} scholarship={s} />
        ))}
      </div>
    </SavedScholarshipIdsProvider>
  );
}
