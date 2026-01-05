import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash, Image } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { getFoundItems, removeFoundItem } from "@/lib/store";

export default function SavedFound() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Only load saved found items when logged in as a desk user
    if (sessionStorage.getItem("userType") === "desk") {
      setItems(getFoundItems());
    } else {
      setItems([]);
    }
  }, []);

  const handleRemove = async (id: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      const ok = removeFoundItem(id);
      if (ok) {
        setItems(getFoundItems());
      } else {
        // eslint-disable-next-line no-console
        console.info("Attempted to remove item, but it was not found in store:", id);
        alert("Failed to remove item");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to remove item", e);
      alert("Failed to remove item");
    } finally {
      setDeletingId(null);
    }
  }; 

  if (sessionStorage.getItem("userType") !== "desk") {
    return (
      <PageContainer title="Saved Found Items" showBack backTo="/home">
        <div className="mx-auto max-w-lg space-y-6 py-4">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground">Access restricted</h3>
            <p className="text-sm text-muted-foreground">Saved found items are only visible to Lost & Found Desk users. Please sign in as a desk user to manage desk inventory.</p>
            <div className="mt-4">
              <Button variant="hero" onClick={() => navigate("/login")}>Sign in as Desk</Button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Saved Found Items" showBack backTo="/home">
      <div className="mx-auto max-w-lg space-y-6 py-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Image className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No saved items</h3>
            <p className="text-sm text-muted-foreground">Items uploaded from desks or added locally will appear here for later matching.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-md border p-3">
                {it.imageUrl ? (
                  <img src={it.imageUrl} alt={it.title} className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-secondary/30" />
                )}

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{it.deskLocation || it.location}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{(it.labels || []).join(", ")}</div>
                </div>

                <div>
                  <Button variant="ghost" onClick={() => handleRemove(it.id)} disabled={deletingId === it.id}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
