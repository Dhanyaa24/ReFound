import { sampleFoundItems, FoundItem } from "./sampleFoundItems";

// Simple in-memory store used for local prototype/demo.
const items: FoundItem[] = [...sampleFoundItems];

export function getFoundItems() {
  return items;
}

export async function addFoundItem(item: FoundItem) {
  // If we have an image, try to compute an embedding (best-effort)
  if (item.imageUrl && !item.embedding) {
    try {
      const { getImageEmbeddingFromDataUrl } = await import("./embeddings");
      // If imageUrl is a remote URL, fetch and convert to dataURL
      let dataUrl = item.imageUrl;
      if (!dataUrl.startsWith("data:")) {
        const res = await fetch(item.imageUrl);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(blob);
        });
      }
      item.embedding = await getImageEmbeddingFromDataUrl(dataUrl);
    } catch (err) {
      // ignore embedding failures for prototype
      console.warn("Embedding failed:", err);
    }
  }

  items.unshift(item);
}
