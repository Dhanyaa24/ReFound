import { FoundItem, sampleFoundItems } from "./sampleFoundItems";
import { VisionResult } from "./googleVision";

export type Match = {
  item: FoundItem;
  score: number; // 0..1
  matchedLabels: string[];
};

function jaccard(a: string[], b: string[]) {
  const sa = new Set(a.map((s) => s.toLowerCase()));
  const sb = new Set(b.map((s) => s.toLowerCase()));
  const inter = new Set([...sa].filter((x) => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size === 0 ? 0 : inter.size / union.size;
}

import { getFoundItems } from "./store";
import { cosineSimilarity } from "./embeddings";

export function findMatches(vision: VisionResult & { embedding?: number[] }, description?: string, candidates: FoundItem[] = getFoundItems()): Match[] {
  const queryLabels = [...vision.labels, ...vision.webEntities].map((s) => s.toLowerCase());
  const descTokens = (description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  const matches = candidates.map((item) => {
    const labelScore = jaccard(queryLabels, item.labels.map((s) => s.toLowerCase()));
    const descScore = jaccard(descTokens, (item.description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));

    // Embedding similarity (if available)
    const embScore = vision.embedding && item.embedding ? cosineSimilarity(vision.embedding, item.embedding) : 0;

    // Weighted score: embeddings 50%, labels 35%, description 15%
    const score = embScore * 0.5 + labelScore * 0.35 + descScore * 0.15;

    const matchedLabels = item.labels.filter((l) => queryLabels.includes(l.toLowerCase()));

    return { item, score, matchedLabels };
  });

  return matches.sort((a, b) => b.score - a.score);
}
