export type FoundItem = {
  id: string;
  title: string;
  imageUrl?: string;
  labels: string[]; // labels extracted by Vision when item was uploaded
  embedding?: number[]; // optional embedding vector for similarity search
  description?: string;
  location?: string;
  timestamp?: string;
};

export const sampleFoundItems: FoundItem[] = [
  {
    id: "item-1",
    title: "Black Wallet",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    labels: ["wallet", "leather", "accessory", "black"],
    description: "Small black leather wallet",
    location: "Central Library",
  },
  {
    id: "item-2",
    title: "Silver Ring",
    imageUrl: "https://images.unsplash.com/photo-1545534370-5f9d22be9d1f?w=800&q=80",
    labels: ["ring", "jewelry", "silver"],
    description: "Thin silver band with engraving",
    location: "Main Bus Station",
  },
  {
    id: "item-3",
    title: "Blue Backpack",
    imageUrl: "https://images.unsplash.com/photo-1520975913146-8d6f7b5cfb4e?w=800&q=80",
    labels: ["backpack", "bag", "blue", "fabric"],
    description: "Large blue backpack with side pockets",
    location: "Campus Quad",
  }
];
