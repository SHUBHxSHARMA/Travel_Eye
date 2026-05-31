export type CheckpointCategory =
  | "gate"
  | "architecture"
  | "sculpture"
  | "engraving"
  | "hall"
  | "mosque"
  | "palace";

export type DiscoveryMethod = "gps" | "photo_match" | "manual";

export interface Checkpoint {
  id: string;
  slug: string;
  name: string;
  category: CheckpointCategory;
  shortDescription: string;
  story: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  referenceImageUrl: string;
  /** Extra reference photos improve scan accuracy */
  referenceImageUrls?: string[];
  sortOrder: number;
}

export interface Site {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  coverImage: string;
  checkpoints: Checkpoint[];
}

export interface Discovery {
  checkpointId: string;
  method: DiscoveryMethod;
  discoveredAt: string;
}
