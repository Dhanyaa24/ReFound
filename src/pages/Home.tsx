import { useNavigate } from "react-router-dom";
import { Search, Upload, Compass, Image } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
export default function Home() {
  const navigate = useNavigate();
  return <PageContainer>
      <div className="flex flex-col items-center py-8">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center space-y-4 text-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 glow-sm">
            <Compass className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to ReFound
            </h1>
            <p className="mt-2 text-muted-foreground">
              How can we help you today?
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid w-full max-w-2xl gap-6 md:grid-cols-2">
          {/* Find Lost Item Card */}
          <button onClick={() => navigate("/find-lost")} className="action-card group text-left animate-fade-in" style={{
          animationDelay: "0.1s"
        }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Find Lost Item
            </h2>
            <p className="mb-3 text-sm text-primary">
              Upload image or describe the item
            </p>
            <p className="text-sm text-muted-foreground">
              Search our database by uploading a photo of your lost item or providing a detailed description. Our AI will help match it with found items.
            </p>
          </button>

          {/* Upload Found Item Card */}
          <button onClick={() => navigate("/upload-found")} className="action-card group text-left animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Upload Found Item
            </h2>
            <p className="mb-3 text-sm text-primary">
              Help return an item
            </p>
            <p className="text-sm text-muted-foreground">
              Found something that doesn't belong to you? Upload it to our platform and help reunite it with its rightful owner.
            </p>
          </button>

          {/* Saved Found Items Card (only for desk users) */}
          {sessionStorage.getItem("userType") === "desk" && (
            <button onClick={() => navigate("/saved-found")} className="action-card group text-left animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Saved Found Items
              </h2>
              <p className="mb-3 text-sm text-primary">
                View locally saved items
              </p>
              <p className="text-sm text-muted-foreground">
                See items saved from lost & found desks or previously uploaded found items stored locally for matching.
              </p>
            </button>
          )}
        </div>

        {/* Stats or Trust Indicators */}
        <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-4 animate-fade-in" style={{
        animationDelay: "0.3s"
      }}>
          <div className="text-center">
            
            
          </div>
          <div className="text-center">
            
            <p className="text-xs text-muted-foreground">ReFound</p>
          </div>
          <div className="text-center">
            
            
          </div>
        </div>
      </div>
    </PageContainer>;
}