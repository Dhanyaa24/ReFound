export type Risk = "high" | "low";

const highKeywords = [
  "wallet",
  "jewelry",
  "ring",
  "phone",
  "id",
  "passport",
  "credit",
  "card",
  "laptop",
  "watch",
  "keys",
];

export function assessRisk(matches: Array<any>): Risk {
  if (!matches || matches.length === 0) return "low";
  const top = matches[0];
  const title = (top?.item?.title || "").toLowerCase();
  const labels = (top?.item?.labels || []).map((l: string) => l.toLowerCase());
  const matchedLabels = (top?.matchedLabels || []).map((l: string) => l.toLowerCase());

  const hasHighKeyword = [...title.split(/[^a-z0-9]+/), ...labels, ...matchedLabels].some((tok: string) =>
    highKeywords.includes(tok)
  );

  // Heuristic: if top score is high and item seems high-value, mark as high-risk
  if (top.score >= 0.4 && hasHighKeyword) return "high";
  // If matchedLabels include explicit high keywords
  if (matchedLabels.some((l: string) => highKeywords.includes(l))) return "high";

  return "low";
}