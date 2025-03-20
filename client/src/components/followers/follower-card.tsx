import { AiFollower } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, PowerOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { responsivenessOptions } from "./follower-create-form";
import { FollowerEditDialog } from "./follower-edit-dialog";
import { FollowerDeactivateDialog } from "./follower-deactivate-dialog";
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
    navigate(`/followers/config/${follower.id}`);
  };

  return (
    <div 
      className={cn(
        "flex flex-col space-y-4 p-4 border rounded-lg transition-opacity",
        !follower.active && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar>
            <img src={follower.avatarUrl} alt={follower.name} />
            <AvatarFallback>
              {follower.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{follower.name}</h3>
              {!follower.active && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {follower.personality}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {responsivenessOptions.find(opt => opt.value === follower.responsiveness)?.label}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            title="Advanced Configuration"
            onClick={handleNavigateToConfig}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <FollowerEditDialog
            trigger={
              <Button
                variant="outline"
                size="icon"
                title="Edit Follower"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            }
            follower={follower}
            onEdit={onEdit}
          />

          <FollowerDeactivateDialog
            trigger={
              <Button 
                variant="outline" 
                size="icon"
                title={follower.active ? "Deactivate Follower" : "Activate Follower"}
                className={cn(
                  follower.active && "hover:bg-destructive/10"
                )}
              >
                <PowerOff className="h-4 w-4 text-destructive" />
              </Button>
            }
            follower={follower}
            onToggleActive={onToggleActive}
            isUpdating={isUpdating}
          />
        </div>
      </div>

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
