import path from "node:path";

export const DATA_DIR = path.join(process.cwd(), "data");

export const PATHS = {
  toResearch: path.join(DATA_DIR, "universities-to-research.json"),
  researched: path.join(DATA_DIR, "universities-researched.json"),
  validated: path.join(DATA_DIR, "universities-validated.json"),
} as const;
