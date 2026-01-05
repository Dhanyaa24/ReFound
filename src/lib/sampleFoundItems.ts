export type FoundItem = {
  id: string;
  title: string;
  imageUrl?: string;
  labels: string[]; // labels extracted by Vision when item was uploaded
  embedding?: number[]; // optional embedding vector for similarity search
  description?: string;
  location?: string;
  timestamp?: string;
  // Optional desk location when a Lost & Found Desk saves the item
  deskLocation?: string;
  // Indicates who saved the item locally: 'desk' if saved by a desk, 'peer' if saved by a peer uploader
  savedBy?: "desk" | "peer";
};

export const sampleFoundItems: FoundItem[] = [
  {
    id: "item-1",
    title: "Black Wallet",
    imageUrl: "/sample-found/item-1.svg",
    labels: ["wallet", "leather", "accessory", "black"],
    description: "Small black leather wallet",
    location: "Central Library",
    savedBy: "peer",
  },
  {
    id: "item-2",
    title: "Silver Ring",
    imageUrl: "/sample-found/item-2.svg",
    labels: ["ring", "jewelry", "silver"],
    description: "Thin silver band with engraving",
    location: "Main Bus Station",
    // Example desk-saved item for demo
    deskLocation: "Central Station Desk",
    savedBy: "desk",
  },
  {
    id: "item-3",
    title: "Blue Backpack",
    imageUrl: "/sample-found/item-3.svg",
    labels: ["backpack", "bag", "blue", "fabric"],
    description: "Large blue backpack with side pockets",
    location: "Campus Quad",
    savedBy: "peer",
  }
];
