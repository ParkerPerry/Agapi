import { AiFollower } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, PowerOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { responsivenessOptions } from "./follower-create-form";
import { FollowerEditDialog } from "./follower-edit-dialog";
import { FollowerDeactivateDialog } from "./follower-deactivate-dialog";
// Temporarily hidden NFT feature
// import { FollowerNftMint } from "./follower-nft-mint";
import { useLocation } from "wouter";

interface FollowerCardProps {
  follower: AiFollower;
  onEdit: (follower: AiFollower) => void;
  onToggleActive: (followerId: number) => void;
  isUpdating: boolean;
}

export function FollowerCard({ follower, onEdit, onToggleActive, isUpdating }: FollowerCardProps) {
  const [_, navigate] = useLocation();

  const handleNavigateToConfig = () => {
    console.log(`[FollowerCard] Navigating to config page for follower ID: ${follower.id}`);
    navigate(`/ai-followers/config/${follower.id}`);
  };

  return (
    <div 
      className={cn(
        "flex flex-col space-y-4 p-4 border rounded-lg transition-opacity relative",
        !follower.active && "opacity-60"
      )}
    >
      {/* Profile section with avatar, action buttons and info */}
      <div className="flex">
        {/* Avatar with buttons below it */}
        <div className="flex flex-col items-center mr-4">
          <Avatar className="h-12 w-12 mb-2">
            <img src={follower.avatarUrl} alt={follower.name} />
            <AvatarFallback>
              {follower.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Action buttons in horizontal row beneath avatar */}
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              title="Advanced Configuration"
              onClick={handleNavigateToConfig}
              className="h-7 w-7 rounded-full"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            
            <FollowerEditDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edit Follower"
                  className="h-7 w-7 rounded-full"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
              follower={follower}
              onEdit={onEdit}
            />
          </div>
        </div>
        
        {/* Follower info with deactivate button on same line as name */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{follower.name}</h3>
              {!follower.active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            
            {/* Deactivate button on the same line as the name */}
            <FollowerDeactivateDialog
              trigger={
                <Button 
                  variant="ghost" 
                  size="icon"
                  title={follower.active ? "Deactivate Follower" : "Activate Follower"}
                  className={cn(
                    "h-7 w-7 rounded-full hover:bg-muted",
                    follower.active && "hover:bg-destructive/10"
                  )}
                >
                  <PowerOff className="h-3.5 w-3.5 text-destructive" />
                </Button>
              }
              follower={follower}
              onToggleActive={onToggleActive}
              isUpdating={isUpdating}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {follower.personality}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {responsivenessOptions.find(opt => opt.value === follower.responsiveness)?.label}
          </p>
        </div>
      </div>

      {/* Temporarily hidden NFT feature */}
      {/* <div className="flex justify-end">
        <FollowerNftMint follower={follower} />
      </div> */}

      {follower.background && (
        <div className="space-y-2 mt-2">
          <p className="text-sm">{follower.background}</p>

          {follower.interests && follower.interests.length > 0 && (
            <div>
              <p className="text-sm font-medium">Interests:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {follower.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="text-xs bg-secondary px-2 py-1 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {follower.communicationStyle && (
            <p className="text-sm">
              <span className="font-medium">Communication style: </span>
              {follower.communicationStyle}
            </p>
          )}

          {follower.interactionPreferences && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Interaction Preferences:</p>
              <div className="space-y-1 pl-2">
                <p className="text-sm">
                  <span className="text-green-600">Likes:</span>{" "}
                  {follower.interactionPreferences.likes.join(", ")}
                </p>
                <p className="text-sm">
                  <span className="text-red-600">Dislikes:</span>{" "}
                  {follower.interactionPreferences.dislikes.join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
