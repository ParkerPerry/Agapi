import { Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatRelativeTime } from "@/utils/date";
import { PendingResponsesProps } from "./post-types";

export function PendingResponses({ pendingResponses, postId }: PendingResponsesProps) {
  if (!pendingResponses?.length) return null;

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex -space-x-2">
        {pendingResponses.map((follower) => (
          <HoverCard key={`${postId}-${follower.id}`}>
            <HoverCardTrigger>
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
                  <p className="text-sm text-muted-foreground">
                    Will respond {formatRelativeTime(follower.scheduledFor)}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}