import { useEffect, useState } from "react";
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
  const [isLocating, setIsLocating] = useState(false);

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

  // Reverse-geocode using Nominatim (OpenStreetMap) to get a readable location
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!res.ok) {
        console.info("Reverse geocode failed", res.status, await res.text());
        return null;
      }
      const data = await res.json();
      const addr = data?.address || {};
      const place = addr.city || addr.town || addr.village || addr.hamlet || addr.county;
      const state = addr.state;
      if (place && state) return `${place}, ${state}`;
      if (state) return state;
      if (place) return place;
      return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } catch (err) {
      console.info("Reverse geocode error", err);
      return null;
    }
  };

  const locateAndSetLocation = async () => {
    if (!("geolocation" in navigator)) {
      console.info("Geolocation not available in this browser");
      return null;
    }

    setIsLocating(true);
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const label = await reverseGeocode(latitude, longitude);
            if (label) {
              handleLocationChange(label);
            } else {
              const fallback = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
              handleLocationChange(fallback);
            }
          } catch (err) {
            console.info("Error during geolocation handling", err);
          } finally {
            setIsLocating(false);
            resolve();
          }
        },
        (err) => {
          console.info("Geolocation error", err);
          setIsLocating(false);
          resolve();
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  };

  // Auto-run location detection once if nothing is stored yet
  useEffect(() => {
    const stored = sessionStorage.getItem("userLocation");
    if (!stored) {
      // Try to get permission and fetch a friendly location label
      locateAndSetLocation().catch((e) => console.info("Auto-locate failed", e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    <span className="text-sm max-w-[120px] truncate hidden sm:inline">{isLocating ? "Locating..." : currentLocation}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Select Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={locateAndSetLocation} className={isLocating ? "opacity-60 pointer-events-none" : ""}>
                    {isLocating ? "Detecting current location..." : "Use current location"}
                  </DropdownMenuItem>

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
