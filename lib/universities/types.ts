/** Candidate from scholarship extraction (U1). */
export interface UniversityCandidate {
  universityName: string;
  country: string;
  sourceScholarships: string[];
}

export interface UniversitiesToResearchFile {
  generatedAt: string;
  stats: {
    scholarshipsScanned: number;
    rawExtractions: number;
    uniqueCandidates: number;
    alreadyInDb: number;
    newToResearch: number;
  };
  universities: UniversityCandidate[];
}

/** Per-fact citation from web research (U2). */
export interface FactSource {
  field: string;
  url: string;
}

/** Output of web research (U2). */
export interface ResearchedUniversity {
  name: string;
  country: string;
  city: string;
  website: string;
  ranking: number | null;
  fields: string[];
  description: string;
  logoUrl: string | null;
  sources: FactSource[];
  researchedAt: string;
}

export interface UniversitiesResearchedFile {
  generatedAt: string;
  stats: {
    requested: number;
    succeeded: number;
    failed: number;
  };
  universities: ResearchedUniversity[];
}

/** After validation (U3). */
export interface ValidatedUniversity extends ResearchedUniversity {
  websiteOk: boolean;
  validationNotes: string[];
}

export interface UniversitiesValidatedFile {
  generatedAt: string;
  stats: {
    input: number;
    valid: number;
    dropped: number;
  };
  universities: ValidatedUniversity[];
}
