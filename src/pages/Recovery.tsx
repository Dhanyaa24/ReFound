import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Building, MessageCircle, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import AIImageDescription from "@/components/AIImageDescription";

export default function Recovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { match?: any; risk?: "high" | "low"; analysis?: any } | null;
  const risk = state?.risk;
  const [descConfirmed, setDescConfirmed] = useState(false);
  const [descText, setDescText] = useState<string | null>(null);

  return (
    <PageContainer title="Recover Your Item" showBack>
      <div className="mx-auto max-w-lg space-y-6 py-4">
        {/* Success Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Shield className="h-8 w-8 text-success" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                Ready for Recovery
              </h2>
              {risk && (
                <div className={`rounded-md px-3 py-1 text-xs font-medium ${risk === 'high' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'}`}>
                  {risk === 'high' ? (
                    <><AlertTriangle className="inline mr-1 h-3 w-3 align-text-bottom" /> High Risk</>
                  ) : (
                    <><CheckCircle className="inline mr-1 h-3 w-3 align-text-bottom" /> Low Risk</>
                  )}
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how you'd like to get your item back
            </p>
          </div>
        </div>

        {/* Recovery Options */}
        {state?.analysis && (
          <div className="mb-4">
            <AIImageDescription analysis={state.analysis} topMatch={state.match} onConfirm={(confirmed: boolean, text: string) => {
              setDescConfirmed(confirmed);
              setDescText(text);
            }} />
          </div>
        )}

        <div className="space-y-4 pt-4">
          {/* Option A - Desk Pickup */}
          <button
            className={`action-card w-full text-left animate-fade-in ${!descConfirmed ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ animationDelay: "0.1s" }}
            onClick={() => {}}
            disabled={!descConfirmed}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Desk Pickup
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Item available at lost & found desk
                </p>
                <Button variant="outline" size="sm" className="mt-4">
                  View Pickup Instructions
                </Button>
              </div>
            </div>
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                OR
              </span>
            </div>
          </div>

          {/* Option B - Secure Chat */}
          <button
            className={`action-card w-full text-left animate-fade-in ${!descConfirmed ? 'opacity-60 pointer-events-none' : ''}`}
            style={{ animationDelay: "0.2s" }}
            onClick={() => navigate("/chat")}
            disabled={!descConfirmed}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  Secure In-App Coordination
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coordinate return securely inside the app
                </p>
                <Button variant="default" size="sm" className="mt-4">
                  Open Secure Chat
                </Button>
              </div>
            </div>
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-xl bg-secondary/50 p-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Privacy Protected</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Personal contact details are never shared. All communication happens securely within the app.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
