import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, User, LogOut, HelpCircle, Circle } from "lucide-react";
import { useTour } from "@/components/tour/tour-context";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export function NavBar() {
  const { user, logoutMutation } = useAuth();
  const { startTour } = useTour();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              CircleTube
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>

              <NotificationDropdown />

              <Link href="/ai-followers">
                <Button variant="ghost" size="icon">
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>

              <Link href="/circles">
                <Button variant="ghost" size="icon">
                  <Circle className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" onClick={startTour}>
                <HelpCircle className="h-[1.2rem] w-[1.2rem]" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </nav>
          </div>

          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}