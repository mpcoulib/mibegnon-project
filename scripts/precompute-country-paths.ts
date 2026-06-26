/**
 * Build-time: precompute SVG paths for country silhouettes on scholarship cards.
 * Run: npm run precompute:country-paths
 */
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { geoPath, geoNaturalEarth1 } from "d3-geo";
import { feature } from "topojson-client";
import topology from "world-atlas/countries-110m.json";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "lib/generated");
const OUT_FILE = path.join(OUT_DIR, "country-paths.json");

const countryIds: Record<string, string> = {
  France: "250",
  Germany: "276",
  Allemagne: "276",
  "United Kingdom": "826",
  "Royaume-Uni": "826",
  UK: "826",
  USA: "840",
  "United States": "840",
  "États-Unis": "840",
  Canada: "124",
  Australia: "36",
  Switzerland: "756",
  Suisse: "756",
  Japan: "392",
  Japon: "392",
  "South Africa": "710",
  "Afrique du Sud": "710",
  China: "156",
  Chine: "156",
  "South Korea": "410",
  "Corée du Sud": "410",
  Turkey: "792",
  Türkiye: "792",
  Netherlands: "528",
  "Pays-Bas": "528",
  Sweden: "752",
  Suède: "752",
  Norway: "578",
  Norvège: "578",
  Belgium: "56",
  Belgique: "56",
  Italy: "380",
  Italie: "380",
  Spain: "724",
  Espagne: "724",
  Portugal: "620",
  Denmark: "208",
  Danemark: "208",
  India: "356",
  Inde: "356",
  Ghana: "288",
  Kenya: "404",
  Rwanda: "646",
  Senegal: "686",
  Sénégal: "686",
  Morocco: "504",
  Maroc: "504",
  Egypt: "818",
  Égypte: "818",
  Ethiopia: "231",
  Éthiopie: "231",
  Cameroon: "120",
  Cameroun: "120",
  Nigeria: "566",
};

function main() {
  // @ts-expect-error world-atlas json typing
  const countries = feature(topology, topology.objects.countries);
  const paths: Record<string, string> = {};

  for (const [name, id] of Object.entries(countryIds)) {
    // @ts-expect-error feature types
    const country = countries.features.find((f) => String(f.id) === id);
    if (!country) continue;
    const projection = geoNaturalEarth1().fitSize([200, 130], country as never);
    const pathGen = geoPath(projection);
    const d = pathGen(country as never);
    if (d) paths[name] = d;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(paths));
  console.log(`Wrote ${Object.keys(paths).length} paths → ${OUT_FILE}`);
}

main();
