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
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const categories = [
  { value: "wallet", label: "Wallet" },
  { value: "jewelry", label: "Jewelry" },
  { value: "phone", label: "Phone" },
  { value: "id", label: "ID / Documents" },
  { value: "other", label: "Other" },
];

export default function UploadFound() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [isAtDesk, setIsAtDesk] = useState(false);
  const [deskLocation, setDeskLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [savedItem, setSavedItem] = useState<any>(null);

  const userType = (sessionStorage.getItem("userType") as "desk" | "peer" | null) || null;

  // If the reporter is a desk and they marked 'at desk', require a desk location (which describes where the item is held)
  const isValid = Boolean(image && category && location && (!(userType === "desk" && isAtDesk) || deskLocation.trim().length > 0));

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

      const newItem: any = {
        id: `item-${Date.now()}`,
        title: category ? `${category} (found)` : "Found item",
        imageUrl: image || undefined,
        labels: analysis?.labels || [],
        description: "",
        location,
        // mark who saved this (desk vs peer)
        savedBy: userType === "desk" ? "desk" : "peer",
        // if the reporter marked 'at desk' and provided a desk location, persist it immediately
        deskLocation: userType === "desk" && isAtDesk ? (deskLocation || undefined) : undefined,
      };

      const { addFoundItem } = await import("@/lib/store");

      if (userType === "desk" && isAtDesk) {
        newItem.deskLocation = deskLocation || undefined;
      }

      // Always persist found items locally so matching works without a backend.
      await addFoundItem(newItem);

      if (userType === "desk" && isAtDesk) {
        toast({ title: "Saved", description: "Found item saved to desk's local list." });
      } else {
        toast({ title: "Saved", description: "Found item saved locally and will be considered for matching." });
      }

      setSavedItem(newItem);
      setSubmitted(true);

      // Helper actions for confirmation UI
    } catch (err: any) {
      alert("Upload failed: " + (err?.message || err));
    }
  };

  // List of selectable nearby centers for demo — in production this could be powered by Places API
  const centers = [
    "Main Library Desk",
    "Central Station Lost & Found",
    "Campus Quad Info Desk",
    "Student Union Lost & Found",
  ];

  const [openFindCenter, setOpenFindCenter] = useState(false);

  const handleFindCenter = () => {
    // Open the selection dialog instead of immediately opening Maps so the user can choose a location
    setOpenFindCenter(true);
  };

  const selectCenter = async (center: string) => {
    try {
      if (!savedItem) {
        toast({ title: "No item", description: "Please save the found item first." });
        setOpenFindCenter(false);
        return;
      }
      const { updateFoundItem } = await import("@/lib/store");
      const updated = await updateFoundItem(savedItem.id, { deskLocation: center, savedBy: 'desk' });
      setSavedItem(updated);
      toast({ title: "Saved", description: `Desk location set to ${center}` });
      setOpenFindCenter(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to set desk location", e);
      alert("Failed to set desk location");
    }
  };

  const handleDone = () => {
    navigate("/home");
  };

  const handleUploadAnother = () => {
    setImage(null);
    setCategory("");
    setLocation("");
    setIsAtDesk(false);
    setSubmitted(false);
    setSavedItem(null);
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

        {/* Lost & Found Desk Checkbox (only for desk users) */}
        {userType === "desk" ? (
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-start space-x-3 rounded-xl bg-secondary/30 p-4">
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
                  The item has been handed to an official collection point — please provide the desk location below.
                </p>
              </div>
            </div>

            {isAtDesk && (
              <div className="space-y-2">
                <Label className="text-sm">Desk location</Label>
                <Input placeholder="e.g., Main Library Desk" value={deskLocation} onChange={(e) => setDeskLocation(e.target.value)} className="h-12 bg-secondary/30" />
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-secondary/30 p-3 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p>If you are handing this item to a lost &amp; found desk, please sign in as a <strong>Lost &amp; Found Desk</strong> to have the item saved to the desk's local list.</p>
          </div>
        )}

        {/* Post-upload confirmation (when submitted) */}
        {submitted ? (
          <div className="animate-fade-in rounded-2xl border border-border bg-card p-6 text-center" style={{ animationDelay: "0.4s" }}>
            <h3 className="text-lg font-semibold text-foreground">Item uploaded</h3>
            <p className="text-sm text-muted-foreground">Found item saved locally. Would you like to find the nearest lost &amp; found center to return it?</p>
            <div className="mt-4 flex gap-3">
              <Button variant="default" onClick={handleFindCenter}>Find lost & found center</Button>
              <Button variant="ghost" onClick={handleDone}>Done</Button>
            </div>
            <div className="mt-3">
              <Button variant="link" onClick={handleUploadAnother}>Upload another</Button>
            </div>

            {/* Center selection dialog */}
            <AlertDialog open={openFindCenter} onOpenChange={setOpenFindCenter}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Select a nearby lost & found center</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose a collection point where you can leave the found item. This will set the desk location for the saved item.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="p-4 space-y-2">
                  {centers.map((c) => (
                    <div key={c} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <div className="font-medium">{c}</div>
                        <div className="text-xs text-muted-foreground">Open hours and contact info (demo)</div>
                      </div>
                      <div>
                        <Button size="sm" onClick={() => selectCenter(c)}>Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setOpenFindCenter(false); window.open("https://www.google.com/maps/search/lost+and+found+near+me", "_blank"); }}>Open Maps</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="pt-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              disabled={!isValid}
              onClick={handleSubmit}
            >
              <Upload className="h-5 w-5" />
              Upload Item
            </Button>

            {/* Helpful hint when the button is disabled */}
            {!isValid && (
              <div className="mt-3 rounded-md bg-destructive/5 border border-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                <p className="font-medium">Missing required fields:</p>
                <ul className="mt-1 list-disc pl-5">
                  {!image && <li>Photo of the item</li>}
                  {!category && <li>Category</li>}
                  {!location && <li>Location found</li>}
                  {userType === "desk" && isAtDesk && !deskLocation && <li>Desk location</li>}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
