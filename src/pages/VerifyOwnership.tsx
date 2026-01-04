import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AIImageDescription from "@/components/AIImageDescription";

// default fallback questions
const verificationQuestions = [
  {
    id: 1,
    question: "What is the approximate value of this item?",
    placeholder: "e.g., $50-100",
  },
  {
    id: 2,
    question: "Can you describe any unique markings or features?",
    placeholder: "e.g., scratch on corner, initials engraved",
  },
  {
    id: 3,
    question: "When did you last have the item?",
    placeholder: "e.g., Yesterday around 3pm",
  },
];


export default function VerifyOwnership() {
  const navigate = useNavigate();
  const location = (window as any).__LOCATION__ || undefined;
  // Prefer questions passed via navigation state, otherwise use defaults
  const passed = (location && location.state) || (window.history && (window.history.state && window.history.state?.state)) || undefined;
  const questionsFromState = passed?.questions as any[] | undefined;

  const questions = questionsFromState && questionsFromState.length > 0 ? questionsFromState : verificationQuestions;

  const passedMatch = passed?.match;
  const risk = passed?.risk as "high" | "low" | undefined;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [descConfirmed, setDescConfirmed] = useState(false);
  const [descText, setDescText] = useState<string | null>(null);

  const allAnswered = questions.every(
    (q: any) => answers[q.id]?.trim().length > 0
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    navigate("/recovery");
  };

  return (
    <PageContainer title="Verify Ownership" showBack>
      <div className="mx-auto max-w-lg space-y-6 py-4">
        {/* Header */}
        <div className="flex items-start gap-4 rounded-xl bg-primary/5 border border-primary/10 p-4 animate-fade-in">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground">
                  Ownership Verification
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please answer the following questions to verify you are the rightful owner of this item. Your answers will be compared against the finder's description.
                </p>
              </div>
              {risk === "high" && (
                <div className="rounded-md bg-warning/10 border border-warning/20 px-3 py-2 text-xs font-medium text-warning">
                  High-risk item — additional verification required
                </div>
              )}
            </div>

            {passedMatch && (
              <div className="mt-3 flex items-center gap-3">
                {passedMatch.imageUrl ? (
                  <img src={passedMatch.imageUrl} alt={passedMatch.title} className="h-12 w-12 rounded-md object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-secondary/30" />
                )}
                <div>
                  <div className="text-sm font-medium">{passedMatch.title}</div>
                  <div className="text-xs text-muted-foreground">{passedMatch.location}</div>
                </div>
              </div>
            )}

            {/* AI description & confirmation */}
            {passed && passed.analysis && (
              <div className="mt-4">
                <AIImageDescription analysis={passed.analysis} topMatch={passedMatch} onConfirm={(confirmed: boolean, text: string) => {
                  setDescConfirmed(confirmed);
                  setDescText(text);
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {questions.map((q: any, index: number) => (
            <div
              key={q.id}
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              <Label className="text-sm font-medium">
                {index + 1}. {q.question}
              </Label>
              <Input
                placeholder={q.placeholder}
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="h-12 bg-secondary/30"
              />
            </div>
          ))}
        </div>

        {/* Trust Notice */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Your answers are encrypted and only used for verification.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            disabled={!allAnswered || isLoading || !descConfirmed}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Verifying...
              </div>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Verify & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
