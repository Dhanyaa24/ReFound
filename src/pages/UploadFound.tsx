import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ImagePlus, X, MapPin } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { value: "wallet", label: "Wallet" },
  { value: "jewelry", label: "Jewelry" },
  { value: "phone", label: "Phone" },
  { value: "id", label: "ID / Documents" },
  { value: "other", label: "Other" },
];

export default function UploadFound() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [isAtDesk, setIsAtDesk] = useState(false);

  const isValid = image && category && location;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      let analysis = null;
      if (image) {
        const { analyzeImageWithVision } = await import("@/lib/googleVision");
        analysis = await analyzeImageWithVision(image);
      }

      const newItem = {
        id: `item-${Date.now()}`,
        title: category ? `${category} (found)` : "Found item",
        imageUrl: image || undefined,
        labels: analysis?.labels || [],
        description: "",
        location,
      };

      const { addFoundItem } = await import("@/lib/store");
      addFoundItem(newItem);

      navigate("/matching", { 
        state: { 
          type: "found",
          category,
          isHighRisk: ["wallet", "jewelry", "phone", "id"].includes(category),
          analysis,
        } 
      });
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || err));
    }
  };

  return (
    <PageContainer title="Upload Found Item" showBack backTo="/home">
      <div className="mx-auto max-w-lg space-y-6 py-4">
        {/* Image Upload Section (Required) */}
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Label className="text-base">Item Photo</Label>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Required
            </span>
          </div>
          {!image ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 transition-all hover:border-primary/50 hover:bg-primary/10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
                <ImagePlus className="h-7 w-7 text-primary" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Click to upload photo
              </p>
              <p className="text-xs text-muted-foreground">
                A clear photo helps match the item
              </p>
            </label>
          ) : (
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={image}
                alt="Uploaded item"
                className="h-48 w-full object-cover"
              />
              <button
                onClick={() => setImage(null)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Label className="text-base">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 bg-secondary/30">
              <SelectValue placeholder="Select item category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Input */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2">
            <Label className="text-base">Location Found</Label>
            <span className="text-xs text-muted-foreground">
              (Google Places powered)
            </span>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter location or address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-12 bg-secondary/30 pl-10"
            />
          </div>
        </div>

        {/* Lost & Found Desk Checkbox */}
        <div className="flex items-start space-x-3 rounded-xl bg-secondary/30 p-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Checkbox
            id="desk"
            checked={isAtDesk}
            onCheckedChange={(checked) => setIsAtDesk(checked as boolean)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <label
              htmlFor="desk"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Item is at a lost & found desk
            </label>
            <p className="text-xs text-muted-foreground">
              The item has been handed to an official collection point
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            <Upload className="h-5 w-5" />
            Upload & Match
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
