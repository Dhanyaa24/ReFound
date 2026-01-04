import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass, Building2, Users } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"desk" | "peer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Store user type in sessionStorage for later use
    if (userType) {
      sessionStorage.setItem("userType", userType);
    }
    
    setIsLoading(false);
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-sm">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              ReFound
            </h1>
            <p className="mt-2 text-muted-foreground">
              One place to reconnect lost items safely.
            </p>
          </div>
        </div>

        {/* User Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">I am...</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType("desk")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                userType === "desk"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm font-medium">Lost & Found Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType("peer")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                userType === "peer"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Individual User</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-secondary/50"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={isLoading || !email || !password || !userType}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Quick Login */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            sessionStorage.setItem("userType", "peer");
            navigate("/home");
          }}
        >
          Continue as Guest
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
