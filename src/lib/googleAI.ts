export type VerificationQuestion = { id: number; question: string; placeholder?: string };

export async function generateVerificationQuestions(topMatch: any, allMatches: any[]): Promise<VerificationQuestion[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const isGenerativeEnabled = (() => {
    const v = import.meta.env.VITE_ENABLE_GENERATIVE_QS;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() !== 'false';
    return true;
  })();

  const prompt = `You are an assistant that generates 3 short verification questions (question + short placeholder) to safely verify ownership of a found item. The match info: title: ${topMatch?.item?.title || 'unknown'}, labels: ${(topMatch?.item?.labels || []).join(', ')}, description: ${topMatch?.item?.description || ''}, location: ${topMatch?.item?.location || ''}. Return the questions one per line as: "1. Question? | placeholder"`;

  // Fallback default questions
  const defaultQuestions: VerificationQuestion[] = [
    { id: 1, question: "Can you describe any unique markings or features?", placeholder: "e.g., scratch on corner, initials" },
    { id: 2, question: "When did you last have the item?", placeholder: "e.g., Yesterday around 3pm" },
    { id: 3, question: "What is the approximate value of this item?", placeholder: "e.g., $50-100" },
  ];

  if (!apiKey || !isGenerativeEnabled) {
    if (!isGenerativeEnabled) console.info("Generative verification questions are disabled via VITE_ENABLE_GENERATIVE_QS");
    if (!apiKey) console.warn("VITE_GOOGLE_API_KEY is not set — using default verification questions.");
    return defaultQuestions;
  }

  try {
    const body = {
      prompt: {
        text: prompt,
      },
      // control settings (optional)
      maxOutputTokens: 300,
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn("Google AI returned non-ok status", res.status);
      return defaultQuestions;
    }

    const json = await res.json();
    // The generated text typically appears in json?.candidates?.[0]?.content
    const content = json?.candidates?.[0]?.content || json?.output?.[0]?.content || "";
    if (!content) return defaultQuestions;

    // Parse lines like: "1. Question? | placeholder"
    const lines = content.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    const out: VerificationQuestion[] = [];
    let id = 1;
    for (const line of lines) {
      const parts = line.split("|").map((p) => p.trim());
      const qPart = parts[0].replace(/^\d+\.?\s*/, "");
      const placeholder = parts[1] || "";
      out.push({ id: id++, question: qPart, placeholder: placeholder || undefined });
      if (out.length >= 3) break;
    }

    if (out.length === 0) return defaultQuestions;
    return out;
  } catch (err) {
    console.warn("generateVerificationQuestions failed", err);
    return defaultQuestions;
  }
}

// Generate a short, human-friendly description for an uploaded image based on Vision analysis.
export async function generateImageDescription(analysis: any, topMatch?: any): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const isGenerativeEnabled = (() => {
    const v = import.meta.env.VITE_ENABLE_GENERATIVE_QS;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() !== 'false';
    return true;
  })();

  const labels = (analysis?.labels || []).join(', ');
  const entities = (analysis?.webEntities || []).join(', ');

  const fallback = labels ? `Image appears to contain: ${labels}.` : "Image description not available.";
  if (!apiKey || !isGenerativeEnabled) {
    if (!isGenerativeEnabled) console.info("Generative image descriptions are disabled via VITE_ENABLE_GENERATIVE_QS");
    if (!apiKey) console.warn("VITE_GOOGLE_API_KEY is not set — using fallback image description.");
    return fallback;
  }

  try {
    const prompt = `Write a 1-2 sentence description of an image using the following detected tags: ${labels}. If location or context is relevant, mention it: ${topMatch?.item?.location || ''}.`;
    const body = {
      prompt: { text: prompt },
      maxOutputTokens: 100,
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn('Image description generation failed', res.status);
      return fallback;
    }

    const json = await res.json();
    const content = json?.candidates?.[0]?.content || json?.output?.[0]?.content || '';
    if (!content) return fallback;
    const desc = content.split('\n').map((l: string) => l.trim()).filter(Boolean).join(' ');
    return desc;
  } catch (err) {
    console.warn('generateImageDescription error', err);
    return fallback;
  }
}
