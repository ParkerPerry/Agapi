import { Circle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Users, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { CircleShareDialog } from "./circle-share-dialog";
import { CircleFollowerManager } from "./circle-follower-manager";
import { CircleDeleteDialog } from "./circle-delete-dialog";
import { CircleEditDialog } from "./circle-edit-dialog";

interface CircleCardProps {
  circle: Circle;
  onEdit?: (circle: Circle) => void;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
  showShareButton?: boolean;
}

export function CircleCard({
  circle,
  onEdit,
  onDelete,
  isDeleting,
  showShareButton = true,
}: CircleCardProps) {
  const [, navigate] = useLocation();

  return (
    <div
      className={cn(
        "flex flex-col p-4 border rounded-lg relative",
        circle.isDefault && "bg-muted"
      )}
      style={{ borderColor: circle.color }}
    >
      {/* Subtle shared indicator */}
      {circle.visibility === "shared" && (
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 opacity-70"
        >
          shared
        </Badge>
      )}

      {/* Circle header with icon and details */}
      <div className="flex items-start space-x-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full text-2xl flex-shrink-0"
          style={{ backgroundColor: circle.color + "20" }}
        >
          {circle.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{circle.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {circle.description}
          </p>
        </div>
      </div>

      {/* Primary action button */}
      <div className="mt-4">
        <Button
          variant="default"
          className="w-full"
          onClick={() => navigate(`/?circle=${circle.id}`)}
        >
          Enter Circle
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2 mt-3 justify-end">
        {showShareButton && !circle.isDefault && (
          <CircleShareDialog circle={circle} />
        )}

        <CircleFollowerManager circle={circle} />

        {!circle.isDefault && (
          <>
            <CircleEditDialog
              circle={circle}
              onEdit={onEdit}
            />

            <CircleDeleteDialog
              circle={circle}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </>
        )}
      </div>
    </div>
  );
}