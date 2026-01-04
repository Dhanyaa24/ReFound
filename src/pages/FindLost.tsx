import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ImagePlus, X } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function FindLost() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const isValid = image || description.trim().length > 0;

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
      let analysis: any = null;
      let matches: any[] = [];

      if (image) {
        const { analyzeImageWithVision } = await import("@/lib/googleVision");
        const { findMatches } = await import("@/lib/matcher");
        const { getImageEmbeddingFromDataUrl } = await import("@/lib/embeddings");

        analysis = await analyzeImageWithVision(image);
        // compute embedding for the query image
        try {
          const embedding = await getImageEmbeddingFromDataUrl(image);
          analysis.embedding = embedding;
        } catch (e) {
          console.warn("Failed to compute embedding for query image", e);
        }

        matches = findMatches(analysis, description);
      } else {
        // If no image, we can try to match by description only (not implemented: uses description token matching)
        const { findMatches } = await import("@/lib/matcher");
        matches = findMatches({ labels: [], webEntities: [], raw: {} }, description);
      }

      navigate("/matching", { state: { type: "lost", analysis, matches } });
    } catch (err: any) {
      // For now show a simple alert — we can replace with toast later
      alert("Matching failed: " + (err?.message || err));
    }
  };

  return (
    <PageContainer title="Find Lost Item" showBack backTo="/home">
      <div className="mx-auto max-w-lg space-y-8 py-4">
        {/* Image Upload Section */}
        <div className="space-y-3 animate-fade-in">
          <Label className="text-base">Item Photo (Optional)</Label>
          {!image ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-8 transition-all hover:border-primary/50 hover:bg-secondary/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <ImagePlus className="h-7 w-7 text-primary" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Click to upload photo
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
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

        {/* Description Section */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Label htmlFor="description" className="text-base">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Color, material, markings, where you last saw it…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-32 resize-none bg-secondary/30"
          />
        </div>

        {/* Helper Text */}
        <div className="rounded-xl bg-secondary/50 p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> You can submit with either an image or a description. The more details you provide, the better our AI can match your item.
          </p>
        </div>

        {/* Submit Button */}
        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!isValid}
            onClick={handleSubmit}
          >
            <Upload className="h-5 w-5" />
            Search for Match
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
