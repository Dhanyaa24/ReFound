import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, AlertTriangle, CheckCircle, Image, Trash } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AIImageDescription from "@/components/AIImageDescription";
import { useToast } from "@/hooks/use-toast";

function NotifyButton({ state, toast }: { state: any; toast: any }) {
  const [saved, setSaved] = useState(false);

  const handleNotify = async () => {
    try {
      const { addPendingSearch } = await import("@/lib/store");
      const id = `pending-${Date.now()}`;
      await addPendingSearch({
        id,
        image: state?.image ?? null,
        description: state?.description ?? "",
        timestamp: new Date().toISOString(),
        notified: false,
      });
      setSaved(true);
      toast({ title: "Saved", description: "We'll notify you if a matching item is reported." });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to save pending search", e);
      alert("Failed to save notification");
    }
  };

  return (
    <div>
      {!saved ? (
        <Button variant="hero" onClick={handleNotify}>Notify me if found</Button>
      ) : (
        <div className="text-sm text-muted-foreground">Notification saved — we'll notify you if we find a match.</div>
      )}
    </div>
  );
}

export default function MatchResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { 
    type?: string; 
    category?: string; 
    isHighRisk?: boolean;
    confidence?: string;
    analysis?: any;
    matches?: Array<any>;
    image?: string | null;
    description?: string | null;
    questions?: any[];
  } | null;

  const { toast } = useToast();

  const risk = (state as any)?.risk as "high" | "low" | undefined;
  const isHighRisk = (risk === "high") || (state?.isHighRisk ?? (state?.category && 
    ["wallet", "jewelry", "phone", "id"].includes(state.category)));

  // Manage a local copy of matches so desk users can delete items in-place
  const [localMatches, setLocalMatches] = useState<any[]>(state?.matches || []);
  const isDesk = sessionStorage.getItem("userType") === "desk";
  // track which item is currently being deleted to avoid duplicate calls
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive a human-facing confidence label from either the passed-in confidence
  // or from the top match's score when available. This avoids defaulting to
  // "high" when no score is present (which caused false-high labels like for "water bottle").
  const confidence = state?.confidence ?? (
    localMatches && localMatches[0]
      ? (localMatches[0].score >= 0.6 ? "high" : localMatches[0].score >= 0.3 ? "medium" : "low")
      : "medium"
  );

  const topMatch = localMatches && localMatches[0];
  const matchReasonKey = topMatch?.reason || null;
  const matchReasonLabel = matchReasonKey === 'image-exact' ? 'Exact image' : matchReasonKey === 'embedding' ? 'Embedding' : matchReasonKey === 'vision' ? 'Vision labels' : matchReasonKey === 'description' ? 'Description' : null;

  // Debug: log incoming matches for investigation
  // eslint-disable-next-line no-console
  console.info("MatchResult loaded: matches", localMatches && localMatches.slice(0,3).map((m: any) => ({ id: m.item.id, score: m.score, reason: m.reason })));

  const handleDeleteMatch = async (id: string) => {
    if (deletingId === id) return; // already in progress
    if (!confirm("Delete this saved item? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const { removeFoundItem } = await import("@/lib/store");
      const ok = removeFoundItem(id);
      if (ok) {
        const next = localMatches.filter((m) => m.item.id !== id);
        setLocalMatches(next);
        toast({ title: "Deleted", description: "Item removed from saved found items." });
      } else {
        // More explicit feedback when the store didn't contain the item
        toast({ title: "Not found", description: "Item was not present in saved items." });
        // eslint-disable-next-line no-console
        console.info("Attempted to remove item, but it was not found in store:", id);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Failed to remove found item", e);
      toast({ title: "Error", description: "Failed to remove item — check console for details." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer title="Match Found" showBack backTo="/home">
      <div className="mx-auto max-w-lg space-y-6 py-4">
        {/* Match Card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card animate-scale-in">
          {/* Image Placeholder / Top Match */}
          <div className="flex h-48 items-center justify-center bg-secondary/50">
            {state?.matches && state.matches.length > 0 ? (
              <img
                src={state.matches[0].item.imageUrl}
                alt={state.matches[0].item.title}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Image className="h-12 w-12" />
                <span className="text-sm">Matched Item</span>
              </div>
            )}
          </div>

          {/* Match Info */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                Potential Match Found
              </h3>
              {risk && (
                <Badge variant={risk === "high" ? "destructive" : "default"} className={risk === "high" ? "bg-warning text-warning-foreground" : "bg-success text-success-foreground"}>
                  {risk === "high" ? (
                    <><AlertTriangle className="mr-1 h-3 w-3" /> High Risk</>
                  ) : (
                    <><CheckCircle className="mr-1 h-3 w-3" /> Low Risk</>
                  )}
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Badge
                  variant={confidence === "high" ? "default" : "secondary"}
                  className={confidence === "high" ? "bg-success text-success-foreground" : ""}
                >
                  {confidence === "high" ? (
                    <><CheckCircle className="mr-1 h-3 w-3" /> High Confidence</>
                  ) : (
                    "Medium Confidence"
                  )}
                </Badge>

                {isDesk && topMatch && (
                  <Button variant="ghost" onClick={() => handleDeleteMatch(topMatch.item.id)} disabled={deletingId === topMatch.item.id}>
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Matched using visual similarity and contextual filters including location and time reported.
            </p>

            {matchReasonLabel && (
              <div className="mt-1 text-xs text-muted-foreground">Matched by: <strong className="text-foreground">{matchReasonLabel}</strong></div>
            )}

            {/* If there are no good matches, show a notify option */}
            {(!(state?.matches && state.matches.length > 0) || (state?.matches && state.matches[0] && state.matches[0].score < 0.15)) && (
              <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3">
                <h3 className="text-lg font-semibold text-foreground">No match found</h3>
                <p className="text-sm text-muted-foreground">We couldn't find a suitable match right now. We'll notify you if a matching item is reported.</p>
                <div className="pt-2">
                  <NotifyButton state={state} toast={toast} />
                </div>
              </div>
            )}

            {/* AI-generated description and confirmation */}
            {state?.analysis && (
              <AIImageDescription
                analysis={state.analysis}
                topMatch={state.matches && state.matches[0]}
              />
            )}

            {/* Other top matches */}
            {state?.matches && state.matches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Top matches</h4>
                <ul className="space-y-2">
                  {localMatches.slice(0, 3).map((m: any) => (
                    <li key={m.item.id} className="flex items-center gap-3 rounded-md border p-2">
                      <img src={m.item.imageUrl} alt={m.item.title} className="h-12 w-12 rounded-md object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{m.item.title}</div>
                          <div className="text-xs text-muted-foreground">{Math.round(m.score * 100)}%</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{m.matchedLabels?.join(', ')}</div>
                      </div>

                      {isDesk && (
                        <div>
                          <Button variant="ghost" onClick={() => handleDeleteMatch(m.item.id)} disabled={deletingId === m.item.id}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      )} 
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* High-Risk Warning */}
        {isHighRisk && (
          <div className="flex items-start gap-3 rounded-xl bg-warning/10 border border-warning/20 p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                High-value item — ownership verification required
              </p>
              <p className="text-xs text-muted-foreground">
                To protect against fraud, you'll need to answer a few questions to verify ownership.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {isHighRisk ? (
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={() => {
                const payload = { questions: (state as any)?.questions, match: (state as any)?.matches && (state as any).matches[0], risk, analysis: (state as any)?.analysis };
                // persist payload as a fallback for navigation/reload issues
                try { sessionStorage.setItem('lastMatch', JSON.stringify(payload)); } catch (e) { /* ignore */ }
                // eslint-disable-next-line no-console
                console.info('MatchResult: navigating to verify-ownership with', payload);
                navigate("/verify-ownership", { state: payload });
              }}
            >
              <Shield className="h-5 w-5" />
              Verify Ownership
            </Button>
          ) : (
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={() => {
                // Debug: log navigation payload
                // eslint-disable-next-line no-console
                console.info('MatchResult: navigating to recovery with match', (state as any)?.matches && (state as any).matches[0]);
                navigate("/recovery", { state: { match: (state as any)?.matches && (state as any).matches[0], risk, analysis: (state as any)?.analysis } });
              }}
            >
              <CheckCircle className="h-5 w-5" />
              Continue to Recovery
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
