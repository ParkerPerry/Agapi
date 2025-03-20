import { Clock, Pencil, MessageSquare, Timer } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatRelativeTime } from "@/utils/date";
import { PendingResponsesProps } from "./post-types";

export function PendingResponses({ pendingResponses, postId }: PendingResponsesProps) {
  if (!pendingResponses?.length) return null;

  // Function to determine response status based on scheduled time
  const getResponseStatus = (scheduledTime: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) {
      return {
        status: "Thinking...",
        icon: <MessageSquare className="h-3 w-3 text-primary" />,
        class: "bg-primary/10 border-primary/30"
      };
    } else if (diffMinutes < 30) {
      return {
        status: "Crafting response...",
        icon: <Pencil className="h-3 w-3 text-amber-500" />,
        class: "bg-amber-100 border-amber-300"
      };
    } else {
      return {
        status: "Will respond later",
        icon: <Timer className="h-3 w-3 text-slate-500" />,
        class: "bg-slate-100 border-slate-300"
      };
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex -space-x-2">
        {pendingResponses.map((follower) => {
          const scheduledTime = new Date(follower.scheduledFor);
          const { status, icon, class: statusClass } = getResponseStatus(scheduledTime);
          
          return (
            <HoverCard key={`${postId}-${follower.id}`}>
              <HoverCardTrigger>
                <div className="relative">
                  <Avatar className="h-6 w-6 border-2 border-background">
                    {follower.avatarUrl && (
                      <img
                        src={follower.avatarUrl}
                        alt={follower.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <AvatarFallback>{follower.name[0]}</AvatarFallback>
                  </Avatar>
                  {/* Status indicator overlay */}
                  <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border ${statusClass}`}>
                    {icon}
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-60">
                <div className="flex justify-between space-x-4">
                  <Avatar>
                    {follower.avatarUrl && (
                      <img
                        src={follower.avatarUrl}
                        alt={follower.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <AvatarFallback>{follower.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{follower.name}</h4>
                    <div>
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground">Status:</span> {status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expected in {formatRelativeTime(follower.scheduledFor)}
                      </p>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}