export type Risk = "high" | "low";

// Strong vs moderate keywords (weights control emphasis)
const STRONG_KEYWORDS = [
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
  "camera",
  "tablet",
  // jewelry-specific keywords (including metals & common item names)
  "gold",
  "silver",
  "necklace",
  "bracelet",
  "earring",
  "chain",
  "diamond",
  "gem",
  "medallion",
];
const MODERATE_KEYWORDS = ["bag", "purse", "backpack", "documents"];

function containsKeywordToken(text: string, keyword: string) {
  const toks = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return toks.includes(keyword.toLowerCase());
}

function computeKeywordScore(tokens: string[], labels: string[], matchedLabels: string[]) {
  // Return a score 0..1 where 1 means definite high-value item
  const all = [...tokens, ...labels, ...matchedLabels].filter(Boolean).map((s) => String(s).toLowerCase());
  let score = 0;

  // If any token/label is a direct strong keyword => 1
  for (const t of all) {
    for (const k of STRONG_KEYWORDS) {
      if (containsKeywordToken(t, k)) {
        return 1;
      }
    }
  }

  // Otherwise, if any moderate keyword appears, return a moderate score
  for (const t of all) {
    for (const k of MODERATE_KEYWORDS) {
      if (containsKeywordToken(t, k)) score = Math.max(score, 0.5);
    }
  }

  return score;
}

// Improved, async risk assessment. When confidence is high but keyword evidence is low,
// we do an optional check with Google Vision on the top match image to validate.
export async function assessRisk(matches: Array<any>): Promise<Risk> {
  if (!matches || matches.length === 0) return "low";
  const top = matches[0];
  const title = (top?.item?.title || "").toLowerCase();
  const labels = (top?.item?.labels || []).map((l: string) => l.toLowerCase());
  const matchedLabels = (top?.matchedLabels || []).map((l: string) => l.toLowerCase());

  const tokens = [...title.split(/[^a-z0-9]+/), ...labels, ...matchedLabels];
  const keywordScore = computeKeywordScore(tokens, labels, matchedLabels); // 0..1
  const confidence = typeof top.score === "number" ? top.score : 0;

  // Quick wins: explicit strong keyword in matchedLabels => high
  if (matchedLabels.some((l: string) => STRONG_KEYWORDS.some((k) => containsKeywordToken(l, k)))) return "high";

  // Development-time logging to help tune thresholds
  if (process.env.NODE_ENV === "development") {
    // Keep logs concise
    // eslint-disable-next-line no-console
    console.debug("assessRisk", { title, labels, matchedLabels, confidence, keywordScore });
  }

  // If we have strong keyword evidence, combine confidence and keyword score with conservative weights
  if (keywordScore >= 0.6) {
    const riskScore = Math.min(1, confidence * 0.6 + keywordScore * 0.4);
    return riskScore >= 0.6 ? "high" : "low";
  }

  // If there is little keyword evidence but confidence is high, run a best-effort Vision check on the top match image
  if ((keywordScore < 0.6) && confidence >= 0.8 && top?.item?.imageUrl) {
    try {
      const { analyzeImageWithVision } = await import("./googleVision");
      // Fetch the image and convert to data URL if necessary
      let dataUrl = top.item.imageUrl;
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

      const vision = await analyzeImageWithVision(dataUrl);
      const vlabels = (vision.labels || []).map((l: string) => l.toLowerCase());

      // If vision labels include any strong keyword, mark high; otherwise low
      if (vlabels.some((l: string) => STRONG_KEYWORDS.some((k) => containsKeywordToken(l, k)))) return "high";
      return "low";
    } catch (e) {
      // If vision check fails, fall back to low to avoid false positives
      // eslint-disable-next-line no-console
      console.warn("Vision check failed during risk assessment", e);
      return "low";
    }
  }

  // Default conservative behavior: require either strong keyword evidence or very high confidence + vision confirmation
  return "low";
}