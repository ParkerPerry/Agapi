import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Reaction } from "@shared/schema";

interface EmojiReactionsProps {
  postId?: number;
  interactionId?: number;
  className?: string;
}

const EMOJI_LIST = [
  { emoji: "👍", name: "thumbs up" },
  { emoji: "❤️", name: "heart" },
  { emoji: "😂", name: "joy" },
  { emoji: "😮", name: "wow" },
  { emoji: "🎉", name: "party" },
];

export function EmojiReactions({
  postId,
  interactionId,
  className,
}: EmojiReactionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ["/api/reactions", { postId, interactionId }],
    enabled: Boolean(postId || interactionId) && Boolean(user),
  });

  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      const response = await apiRequest("POST", "/api/reactions", {
        body: {
          emoji,
          postId,
          interactionId,
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reactions", { postId, interactionId }],
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add reaction. Please try again.",
      });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (reactionId: number) => {
      await apiRequest("DELETE", `/api/reactions/${reactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reactions", { postId, interactionId }],
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove reaction. Please try again.",
      });
    },
  });

  return (
    <TooltipProvider>
      <div className={cn("flex gap-2", className)}>
        {EMOJI_LIST.map(({ emoji, name }) => {
          const reactionCount = reactions.filter((r) => r.emoji === emoji).length;
          const userReaction = reactions.find(
            (r) => r.emoji === emoji && r.userId === user?.id
          );

          return (
            <Tooltip key={emoji}>
              <TooltipTrigger asChild>
                <Button
                  variant={userReaction ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => {
                    if (!user) return;
                    if (userReaction) {
                      removeReaction.mutate(userReaction.id);
                    } else {
                      addReaction.mutate(emoji);
                    }
                  }}
                  disabled={!user || addReaction.isPending || removeReaction.isPending}
                >
                  <span className="relative">
                    {emoji}
                    {reactionCount > 0 && (
                      <span className="absolute -top-1 -right-2 text-xs bg-primary text-primary-foreground rounded-full px-1 min-w-[1.2rem] text-center">
                        {reactionCount}
                      </span>
                    )}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}