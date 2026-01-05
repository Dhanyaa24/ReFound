import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Building, MessageCircle, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import AIImageDescription from "@/components/AIImageDescription";
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

export default function Recovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { match?: any; risk?: "high" | "low"; analysis?: any } | null;
  const risk = state?.risk;
  const { toast } = useToast();
  const hasAnalysis = Boolean(state?.analysis);
  // If there is no AI analysis, mark confirmed by default so buttons are available
  const [descConfirmed, setDescConfirmed] = useState(!hasAnalysis);
  const [descText, setDescText] = useState<string | null>(null);
  const [notifySaved, setNotifySaved] = useState(false);

  // Local UI state for dialogs
  const [openChatConfirm, setOpenChatConfirm] = useState(false);
  const [openPickupInfo, setOpenPickupInfo] = useState(false);

  // Debug: log the incoming match so we can see deskLocation etc.
  // eslint-disable-next-line no-console
  console.info('Recovery loaded with match', state?.match, 'hasAnalysis', hasAnalysis);

  // Normalize match object to a FoundItem when possible (match may be a Match object or a FoundItem)
  const rawMatch = (state as any)?.match;
  const matchedItem: any = rawMatch ? (rawMatch.item ? rawMatch.item : rawMatch) : null;

  // eslint-disable-next-line no-console
  console.info('Recovery normalized matchedItem', matchedItem);

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

            {/* Matched-by badge */}
            {state?.match?.reason && (
              <div className="mt-2 text-xs text-muted-foreground">Matched by: <strong className="text-foreground">{state.match.reason === 'image-exact' ? 'Exact image' : state.match.reason === 'embedding' ? 'Embedding' : state.match.reason === 'vision' ? 'Vision labels' : 'Description'}</strong></div>
            )}
          </div>
        )}

        <div className="space-y-4 pt-4">
          {/* If there's no matched item, hide recovery options */}
          {matchedItem ? (
            <>
              {/* If the matched item is stored at a desk, show only desk pickup */}
              {(matchedItem?.savedBy === 'desk' || matchedItem?.deskLocation) ? (
                <>
                  <button
                    className={`action-card w-full text-left animate-fade-in ${!descConfirmed ? 'opacity-60 pointer-events-none' : ''}`}
                    style={{ animationDelay: "0.1s" }}
                    onClick={() => setOpenPickupInfo(true)}
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
                          Item available at lost & found desk: <strong>{matchedItem?.deskLocation}</strong>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 pointer-events-auto"
                          onClick={() => {
                            // eslint-disable-next-line no-console
                            console.info('View Pickup Instructions clicked', { deskLocation: matchedItem?.deskLocation });
                            setOpenPickupInfo(true);
                          }}
                        >
                          View Pickup Instructions
                        </Button>
                      </div>
                    </div>
                  </button>

                  {/* Pickup info dialog */}
                  <AlertDialog open={openPickupInfo} onOpenChange={setOpenPickupInfo}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Pickup Instructions</AlertDialogTitle>
                        <AlertDialogDescription>
                          This item is being held at <strong>{matchedItem?.deskLocation}</strong>. Please contact the desk or visit the location to retrieve your item.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setOpenPickupInfo(false); toast({ title: "Directions", description: "Opening maps for the desk location" }); window.open(`https://www.google.com/maps/search/${encodeURIComponent(matchedItem?.deskLocation || '')}`, "_blank"); }}>Open in Maps</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                // Otherwise offer secure chat, but confirm before opening
                <>
                  <button
                    className={`action-card w-full text-left animate-fade-in ${(!descConfirmed && hasAnalysis) ? 'opacity-60 pointer-events-none' : ''}`}
                    style={{ animationDelay: "0.2s" }}
                    onClick={() => {
                      // Debug: show current confirmation state and whether analysis exists and desk location
                      // eslint-disable-next-line no-console
                      console.info('Open Secure Chat clicked', { descConfirmed, hasAnalysis, deskLocation: matchedItem?.deskLocation });
                      // If item is actually at a desk, show the pickup info instead of opening chat
                      if (matchedItem?.savedBy === 'desk' || matchedItem?.deskLocation) {
                        setOpenPickupInfo(true);
                        return;
                      }
                      setOpenChatConfirm(true);
                    }}
                    disabled={!descConfirmed && hasAnalysis}
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

                  {/* Confirm before opening chat */}
                  <AlertDialog open={openChatConfirm} onOpenChange={(val) => { setOpenChatConfirm(val); /* eslint-disable-next-line no-console */ console.info('Chat confirm dialog open changed', val); }}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Start Secure Chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This user seems to have your item. Do you want to continue to secure chat to coordinate the return?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { /* eslint-disable-next-line no-console */ console.info('Chat confirm Continue clicked'); setOpenChatConfirm(false); if (matchedItem?.savedBy === 'desk' || matchedItem?.deskLocation) { setOpenPickupInfo(true); return; } navigate("/chat", { state: { match: state.match, risk, analysis: state.analysis, freshChat: true } }); }}>Continue to Chat</AlertDialogAction>

                        {/* Direct fallback button to ensure navigation isn't blocked by the AlertDialog action */}
                        <Button variant="secondary" size="sm" onClick={() => { /* eslint-disable-next-line no-console */ console.info('Chat direct fallback clicked'); setOpenChatConfirm(false); navigate('/chat', { state: { match: state.match, risk, analysis: state.analysis, freshChat: true } }); }}>
                          Continue to Chat (direct)
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground">No matched item</h3>
              <p className="text-sm text-muted-foreground">We don't have a matched item, so pickup or secure coordination aren't available.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="default" onClick={() => navigate('/find-lost')}>Search again</Button>
                <Button variant="outline" onClick={() => navigate('/home')}>Done</Button>
              </div>

              {/* Notify me action */}
              <div className="mt-4">
                {!notifySaved ? (
                  <Button
                    variant="hero"
                    onClick={async () => {
                      try {
                        const { addPendingSearch } = await import("@/lib/store");
                        const id = `pending-${Date.now()}`;
                        await addPendingSearch({
                          id,
                          image: (state as any)?.analysis?.image || (state as any)?.image || null,
                          description: (state as any)?.analysis?.raw?.description || (state as any)?.description || "",
                          timestamp: new Date().toISOString(),
                          notified: false,
                        });
                        setNotifySaved(true);
                        toast({ title: "Saved", description: "You will be notified if a matching item is reported." });
                      } catch (e) {
                        // eslint-disable-next-line no-console
                        console.warn("Failed to save pending search", e);
                        alert("Failed to save notification");
                      }
                    }}
                  >
                    Notify me if found
                  </Button>
                ) : (
                  <div className="mt-2 text-sm text-muted-foreground">You will be notified soon — we'll contact you if a matching item is reported.</div>
                )}
              </div>
            </div>
          )}
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
