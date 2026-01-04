let model: any = null;
let tf: any = null;

async function loadModel() {
  if (model && tf) return { tf, model };
  tf = await import('@tensorflow/tfjs');
  const mobilenet = await import('@tensorflow-models/mobilenet');
  model = await mobilenet.load({ version: 2, alpha: 1.0 });
  return { tf, model };
}

function createImageElementFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

export async function getImageEmbeddingFromDataUrl(dataUrl: string): Promise<number[]> {
  const { tf, model } = await loadModel();
  const img = await createImageElementFromDataUrl(dataUrl);

  const tensor = tf.browser.fromPixels(img).toFloat();
  // mobilenet model expects input between -1 and 1
  const resized = tf.image.resizeBilinear(tensor, [224, 224]);
  const normalized = resized.div(127.5).sub(1);
  const batched = normalized.expandDims(0);

  const activation = model.infer ? model.infer(batched, true) : await (model as any).embed(batched);
  // activation may be a tensor
  const arr = await activation.array();
  // activation shape is [1, N]
  const vec = arr[0] as number[];

  // Cleanup tensors
  tf.dispose([tensor, resized, normalized, batched, activation]);

  return vec;
}

export function cosineSimilarity(a: number[] | undefined, b: number[] | undefined) {
  if (!a || !b) return 0;
  const la = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const lb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (la === 0 || lb === 0) return 0;
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  return dot / (la * lb);
}
