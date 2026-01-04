import { useState } from "react";
import { ArrowLeft, MapPin, User, Compass, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  className?: string;
  showHeader?: boolean;
}

const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Austin, TX",
  "Seattle, WA",
];

export function PageContainer({ 
  children, 
  title, 
  showBack = false, 
  backTo,
  className = "",
  showHeader = true
}: PageContainerProps) {
  const navigate = useNavigate();
  const userType = sessionStorage.getItem("userType") || "peer";
  const [currentLocation, setCurrentLocation] = useState(
    sessionStorage.getItem("userLocation") || "San Francisco, CA"
  );

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userType");
    sessionStorage.removeItem("userLocation");
    navigate("/");
  };

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location);
    sessionStorage.setItem("userLocation", location);
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {showHeader && (
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            {/* Left side - Logo and back button */}
            <div className="flex items-center gap-3">
              {showBack ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer" 
                  onClick={() => navigate("/home")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Compass className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-lg font-semibold text-foreground">ReFound</span>
                </div>
              )}
              {title && showBack && (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center gap-1">
              {/* Location Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 px-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm max-w-[120px] truncate hidden sm:inline">{currentLocation}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Select Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {locations.map((location) => (
                    <DropdownMenuItem 
                      key={location} 
                      onClick={() => handleLocationChange(location)}
                      className={currentLocation === location ? "bg-primary/10 text-primary" : ""}
                    >
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>My Account</span>
                      <span className="text-xs font-normal text-muted-foreground capitalize">
                        {userType === "desk" ? "Lost & Found Desk" : "Individual User"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/home")}>
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
