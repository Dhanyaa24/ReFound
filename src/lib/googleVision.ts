export type VisionResult = {
  labels: string[];
  webEntities: string[];
  raw?: any;
};

export async function analyzeImageWithVision(base64Image: string): Promise<VisionResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) {
    // For local development, allow falling back to embedding-only matching when key is missing.
    // This avoids failing the entire matching flow while you set up an API key.
    console.warn("VITE_GOOGLE_API_KEY is not set — skipping Google Vision request and returning empty annotations.");
    return { labels: [], webEntities: [], raw: {} };
  }

  // Remove data:*/*;base64, prefix if present
  const base64 = base64Image.replace(/^data:.*;base64,/, "");

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "WEB_DETECTION", maxResults: 10 }
        ]
      }
    ]
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vision API error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const annotations = json?.responses?.[0] ?? {};

  const labels = (annotations.labelAnnotations || []).map((l: any) => l.description as string);
  const webEntities = (annotations.webDetection?.webEntities || []).map((w: any) => w.description).filter(Boolean);

  return { labels, webEntities, raw: annotations };
}
