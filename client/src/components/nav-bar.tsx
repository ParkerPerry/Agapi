import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  User, 
  LogOut, 
  HelpCircle, 
  Circle,
  MessageCircle,
  Loader2,
  Beaker
} from "lucide-react";
import { useTour } from "@/components/tour/tour-context";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Circle as CircleType } from "@shared/schema";

// Component to handle home navigation with default circle
function HomeLink() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch default circle
  const { data: defaultCircle, isLoading } = useQuery<CircleType>({
    queryKey: ["/api/default-circle"],
    enabled: !!user,
  });

  const navigateToHome = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (defaultCircle && defaultCircle.id) {
      // Navigate to the default circle
      console.log("Navigating to default circle:", defaultCircle.id);
      // Use history.pushState directly with event dispatch for immediate effect
      const url = `/?circle=${defaultCircle.id}`;
      window.history.pushState({}, '', url);
      // The locationchange event will be fired automatically due to our modifications in home-page.tsx
    } else {
      // If no default circle, navigate to root
      console.log("No default circle, navigating to root");
      navigate("/");
    }
  }, [defaultCircle, navigate]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9" 
          onClick={navigateToHome}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />
          ) : (
            <Home className="h-[1.2rem] w-[1.2rem]" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Home</TooltipContent>
    </Tooltip>
  );
}

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { startTour } = useTour();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and brand section */}
        <div className="flex items-center">
          {/* Using Button instead of Link to handle default circle navigation */}
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 px-0 hover:bg-transparent"
            onClick={e => {
              e.preventDefault();
              // Use the same navigation approach as HomeLink component
              if (user) {
                const defaultCircle = queryClient.getQueryData<CircleType>(["/api/default-circle"]);
                if (defaultCircle && defaultCircle.id) {
                  console.log("Logo click: navigating to default circle:", defaultCircle.id);
                  // Use history.pushState which will trigger our locationchange event
                  const url = `/?circle=${defaultCircle.id}`;
                  window.history.pushState({}, '', url);
                } else {
                  console.log("Logo click: no default circle found, navigating to root");
                  window.history.pushState({}, '', "/");
                }
              }
            }}
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
              <img 
                src="/circle-logo.svg" 
                alt="CircleTube Logo" 
                className="h-full w-full object-cover"
              />
            </div>
            <span className="hidden font-semibold text-lg md:inline-block">
              CircleTube
            </span>
          </Button>
        </div>

        {/* Main navigation */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <TooltipProvider>
            {/* Home Link - now using the HomeLink component */}
            <HomeLink />

            {/* AI Followers Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/ai-followers">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>AI Followers</TooltipContent>
            </Tooltip>

            {/* Circles Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/circles">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Circle className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Circles</TooltipContent>
            </Tooltip>

            {/* Labs Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/labs">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Beaker className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Content Studios</TooltipContent>
            </Tooltip>

            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Tour Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={startTour} className="h-9 w-9">
                  <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help Tour</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                <Avatar className="h-9 w-9 border border-primary/10">
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/direct-messages">
                  <div className="flex items-center">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}