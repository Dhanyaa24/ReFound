import { useNavigate, useLocation } from "react-router-dom";
import { Shield, AlertTriangle, CheckCircle, Image } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AIImageDescription from "@/components/AIImageDescription";

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
  } | null;

  const risk = (state as any)?.risk as "high" | "low" | undefined;
  const isHighRisk = (risk === "high") || (state?.isHighRisk ?? (state?.category && 
    ["wallet", "jewelry", "phone", "id"].includes(state.category)));
  const confidence = state?.confidence ?? "high";

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
              <div className="ml-auto">
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
              </div>
            </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Matched using visual similarity and contextual filters including location and time reported.
            </p>

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
                  {state.matches.slice(0, 3).map((m: any) => (
                    <li key={m.item.id} className="flex items-center gap-3 rounded-md border p-2">
                      <img src={m.item.imageUrl} alt={m.item.title} className="h-12 w-12 rounded-md object-cover" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{m.item.title}</div>
                          <div className="text-xs text-muted-foreground">{Math.round(m.score * 100)}%</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{m.matchedLabels?.join(', ')}</div>
                      </div>
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
              onClick={() => navigate("/verify-ownership")}
            >
              <Shield className="h-5 w-5" />
              Verify Ownership
            </Button>
          ) : (
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={() => navigate("/recovery")}
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
