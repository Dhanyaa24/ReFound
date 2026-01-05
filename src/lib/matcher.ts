import { FoundItem, sampleFoundItems } from "./sampleFoundItems";
import { VisionResult } from "./googleVision";

export type Match = {
  item: FoundItem;
  score: number; // 0..1
  matchedLabels: string[];
  // reason: which signal mostly caused this match (exact, embedding, vision, labels, description)
  reason?: string;
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

export function findMatches(vision: VisionResult & { embedding?: number[], imageDataUrl?: string }, description?: string, candidates: FoundItem[] = getFoundItems()): Match[] {
  const queryLabels = [...vision.labels, ...vision.webEntities].map((s) => s.toLowerCase());
  const descTokens = (description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  function base64ForDataUrl(url: string | undefined) {
    if (!url) return null;
    const idx = url.indexOf(',');
    return idx >= 0 ? url.slice(idx + 1) : url;
  }

  const qBase64 = base64ForDataUrl(vision.imageDataUrl);

  const matches = candidates.map((item) => {
    // Exact image equality (data URL base64 or full URL) => immediate perfect match
    if (vision.imageDataUrl && item.imageUrl) {
      const itemBase64 = base64ForDataUrl(item.imageUrl);
      if ((qBase64 && itemBase64 && qBase64 === itemBase64) || (vision.imageDataUrl === item.imageUrl)) {
        return { item, score: 1, matchedLabels: ["image-exact"] };
      }
    }

    const labelScore = jaccard(queryLabels, item.labels.map((s) => s.toLowerCase()));
    const descScore = jaccard(descTokens, (item.description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));

    // Embedding similarity (if available)
    const embScore = vision.embedding && item.embedding ? cosineSimilarity(vision.embedding, item.embedding) : 0;

    // Weighted score: embeddings 50%, labels 35%, description 15%
    const score = embScore * 0.5 + labelScore * 0.35 + descScore * 0.15;

    const matchedLabels = item.labels.filter((l) => queryLabels.includes(l.toLowerCase()));

    // Determine reason by the strongest signal
    let reason = "description";
    if (embScore >= labelScore && embScore >= descScore && embScore > 0) reason = "embedding";
    else if (labelScore >= descScore && labelScore > 0) reason = "vision";
    else if (descScore > 0) reason = "description";

    return { item, score, matchedLabels, reason };
  });

  // Prototype: force a convincing match for demos when enabled
  const forceMatch = (() => {
    const v = import.meta.env.VITE_FORCE_MATCH_PROTOTYPE;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() !== 'false';
    // default to true for local development/demo mode
    return true;
  })();

  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  if (forceMatch) {
    const candidate = candidates && candidates.length > 0 ? candidates[0] : (sampleFoundItems && sampleFoundItems.length > 0 ? sampleFoundItems[0] : null);
    if (candidate) {
      // make sure we don't duplicate the same item in the list
      const filtered = sortedMatches.filter((m) => m.item.id !== candidate.id);
      const forced: Match = { item: candidate, score: 0.95, matchedLabels: candidate.labels || [], reason: 'prototype' };
      // eslint-disable-next-line no-console
      console.info('Prototype forced match applied:', forced.item.id);
      return [forced, ...filtered];
    }
  }
  return sortedMatches;
}

// Helper: fetches and analyzes an image (data URL or remote URL) using Vision API
async function analyzeImageUrlToVision(imageUrl?: string) {
  if (!imageUrl) return { labels: [], webEntities: [], raw: {} };
  try {
    const { analyzeImageWithVision } = await import("./googleVision");
    // If it's a remote URL, fetch and convert to data URL
    let dataUrl = imageUrl;
    if (!dataUrl.startsWith("data:")) {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(blob);
      });
    }
    return await analyzeImageWithVision(dataUrl);
  } catch (e) {
    // On any failure, return empty annotations — this keeps matching conservative
    // eslint-disable-next-line no-console
    console.warn("analyzeImageUrlToVision failed", e);
    return { labels: [], webEntities: [], raw: {} };
  }
}

// Async matcher that uses embeddings, labels, and Vision API when available to score candidates.
export async function findMatchesAsync(vision: VisionResult & { embedding?: number[], imageDataUrl?: string }, description?: string, candidates: FoundItem[] = getFoundItems()): Promise<Match[]> {
  const queryLabels = [...vision.labels, ...vision.webEntities].map((s) => s.toLowerCase());
  const descTokens = (description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  // Precompute vision analysis for query if needed
  const queryVision = { labels: vision.labels || [], webEntities: vision.webEntities || [] };

  const results: Match[] = [];

  // Debug: show how many candidates we're checking
  // eslint-disable-next-line no-console
  console.info("findMatchesAsync: candidates count", candidates.length);

  for (const item of candidates) {
    // Exact image equality check (fast path)
    if (vision.imageDataUrl && item.imageUrl) {
      // compare base64 parts or direct equality
      const qBase = vision.imageDataUrl.split(',').slice(1).join(',');
      const iBase = item.imageUrl.split(',').slice(1).join(',');
      if ((qBase && iBase && qBase === iBase) || vision.imageDataUrl === item.imageUrl) {
        // eslint-disable-next-line no-console
        console.info("findMatchesAsync: exact-image match found", item.id);
        results.push({ item, score: 1, matchedLabels: ["image-exact"], reason: 'image-exact' });
        continue;
      }
    }

    // Embedding similarity (if available)
    const embScore = vision.embedding && item.embedding ? cosineSimilarity(vision.embedding, item.embedding) : 0;

    // If embeddings are present, use them as primary signal
    let visionScore = 0;
    if (embScore > 0) {
      // Also compute label overlap as secondary signal
      const labelOverlap = jaccard(queryLabels, item.labels.map((s) => s.toLowerCase()));
      visionScore = labelOverlap;
    } else {
      // No embedding — fall back to Vision API label comparison where possible
      try {
        const itemVision = await analyzeImageUrlToVision(item.imageUrl);
        const itemLabels = ((itemVision.labels || []) as string[]).map((s) => s.toLowerCase());
        const itemWeb = ((itemVision.webEntities || []) as string[]).map((s) => s.toLowerCase());
        const q = [...queryVision.labels, ...queryVision.webEntities].map((s) => s.toLowerCase());
        visionScore = jaccard(q, [...itemLabels, ...itemWeb]);
      } catch (e) {
        visionScore = 0;
      }
    }

    const descScore = jaccard(descTokens, (item.description || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));

    // Weighted score: embeddings (50%), vision labels (35%), description (15%)
    const score = embScore * 0.5 + visionScore * 0.35 + descScore * 0.15;

    const matchedLabels = item.labels.filter((l) => queryLabels.includes(l.toLowerCase()));

    // Reason attribution
    let reason = "description";
    if (embScore >= visionScore && embScore >= descScore && embScore > 0) reason = "embedding";
    else if (visionScore >= descScore && visionScore > 0) reason = "vision";
    else if (descScore > 0) reason = "description";

    results.push({ item, score, matchedLabels, reason });
  }

  // Debug: show top 3 results before prototype forcing
  // eslint-disable-next-line no-console
  console.info("findMatchesAsync: top results", results.slice(0, 3).map(r => ({ id: r.item.id, score: r.score, reason: r.reason })));

  // Prototype: force a convincing match for demos when enabled
  const forceMatch = (() => {
    const v = import.meta.env.VITE_FORCE_MATCH_PROTOTYPE;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() !== 'false';
    // default to true for local development/demo mode
    return true;
  })();

  const sorted = results.sort((a, b) => b.score - a.score);
  if (forceMatch) {
    const candidate = candidates && candidates.length > 0 ? candidates[0] : (sampleFoundItems && sampleFoundItems.length > 0 ? sampleFoundItems[0] : null);
    if (candidate) {
      const filtered = sorted.filter((m) => m.item.id !== candidate.id);
      const forced: Match = { item: candidate, score: 0.95, matchedLabels: candidate.labels || [], reason: 'prototype' };
      // eslint-disable-next-line no-console
      console.info('Prototype forced match applied:', forced.item.id);
      return [forced, ...filtered];
    }
  }
  return sorted;
}
