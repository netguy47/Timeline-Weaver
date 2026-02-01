
export interface PivotPoint {
  id: string;
  title: string;
  description: string;
}

export interface SystemicConsequences {
  technological: number; // 0-100
  cultural: number;
  political: number;
  summary: string;
}

export interface Plausibility {
  score: number;
  frictionNote: string;
}

/**
 * Represents a physical artifact recovered from a historical timeline.
 */
export interface Artifact {
  title: string;
  type: string;
  content: string;
}

export interface Article {
  id: string;
  parentId: string | null;
  headline: string;
  byline: string;
  intro: string;
  body: string[]; // Archive POV
  groundPOV: {
    format: string; // e.g., "Diary Entry", "Radio Transcript"
    content: string;
  };
  imageUrl: string;
  imagePrompt: string;
  branchPrompt: string;
  soundscapePrompt: string; // Instructions for cinematic audio narration
  pivotPoints: PivotPoint[];
  systemicConsequences: SystemicConsequences;
  plausibility: Plausibility;
  recoveredArtifact?: Artifact;
  historicalEcho?: string;
}

export interface Timeline {
  id: string;
  title: string;
  initialPrompt: string;
  minWordCount: number;
  articles: Article[]; // Flattened array, linked via parentId
  createdAt: string;
}
