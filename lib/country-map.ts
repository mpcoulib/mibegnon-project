import countryPathsData from "@/lib/generated/country-paths.json";

const countryPaths = countryPathsData as Record<string, string>;

/** Returns a precomputed SVG path for a country silhouette, or null. */
export function getCountryPath(countryName: string): string | null {
  return countryPaths[countryName] ?? null;
}
