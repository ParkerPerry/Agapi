import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  User, 
  LogOut, 
  HelpCircle, 
  Circle,
  MessageCircle
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

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { startTour } = useTour();
  const isMobile = useIsMobile();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and brand section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
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
          </Link>
        </div>

        {/* Main navigation */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <TooltipProvider>
            {/* Home Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Home className="h-[1.2rem] w-[1.2rem]" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Home</TooltipContent>
            </Tooltip>

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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageCircle className="mr-2 h-4 w-4" />
                <Link href="/direct-messages">Messages</Link>
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