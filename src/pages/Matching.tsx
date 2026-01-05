import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";

export default function Matching() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { type?: string; category?: string; isHighRisk?: boolean } | null;
  
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate matching progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Navigate to results after animation
    const timeout = setTimeout(async () => {
      // If the previous step provided concrete matches, pass matches and risk to the results page.
      if (state && (state as any).matches) {
        const matches = (state as any).matches;
        try {
          const { assessRisk } = await import("@/lib/risk");
          const risk = await assessRisk(matches);

          // Attempt to pre-generate verification questions (best-effort)
          let questions: any = undefined;
          try {
            const { generateVerificationQuestions } = await import("@/lib/googleAI");
            questions = await generateVerificationQuestions(matches[0], matches);
          } catch (e) {
            console.warn("Question generation failed", e);
          }

          const analysis = (state as any).analysis;
          // Always show MatchResult first so users can see details and choose to verify or continue
          navigate('/match-result', { state: { ...state, matches, risk, questions, analysis } });
          return;
        } catch (e) {
          console.warn("Risk assessment failed", e);
          // Fall back to showing results without risk/questions
          navigate('/match-result', { state: { ...state, risk: undefined } });
          return;
        }
      } else {
        navigate('/match-result', { 
          state: { 
            ...state,
            confidence: Math.random() > 0.3 ? "high" : "medium" 
          } 
        });
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate, state]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-8 text-center">
        {/* Animated Logo */}
        <div className="relative">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-primary/20 pulse-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: "0.5s" }}>
            <div className="h-32 w-32 rounded-full bg-primary/15 pulse-ring" style={{ animationDelay: "0.5s" }} />
          </div>
          
          {/* Center icon */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 glow-primary">
            <Compass className="h-12 w-12 text-primary animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3 animate-fade-in">
          <h2 className="text-xl font-semibold text-foreground">
            Finding Matches
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            AI is matching this item using image, time, and location.
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>

        {/* Progress bar */}
        <div className="w-48 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
