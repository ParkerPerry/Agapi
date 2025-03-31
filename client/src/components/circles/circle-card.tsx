import { Circle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Users, Pencil, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { CircleShareDialog } from "./circle-share-dialog";
import { CircleAIManager } from "./circle-ai-manager";
import { CircleDeleteDialog } from "./circle-delete-dialog";
import { CircleEditDialog } from "./circle-edit-dialog";

interface CircleCardProps {
  circle: Circle;
  onEdit?: (circle: Circle) => void;
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
  showShareButton?: boolean;
  status?: "active" | "deactivated";
}

export function CircleCard({
  circle,
  onEdit,
  onDelete,
  isDeleting,
  showShareButton = true,
  status = "active",
}: CircleCardProps) {
  const [, navigate] = useLocation();

  return (
    <div
      className={cn(
        "flex flex-col p-4 border rounded-lg relative",
        circle.isDefault && "bg-muted",
        status === "deactivated" && "opacity-75"
      )}
      style={{ borderColor: circle.color || undefined }}
    >
      {/* Status badges */}
      <div className="absolute top-2 right-2 flex gap-2">
        {circle.visibility === "shared" && (
          <Badge variant="secondary" className="opacity-70">
            shared
          </Badge>
        )}
        {status === "deactivated" && (
          <Badge variant="destructive" className="opacity-70">
            deactivated
          </Badge>
        )}
      </div>

      {/* Circle header with icon and details */}
      <div className="flex items-start space-x-4">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full text-2xl flex-shrink-0"
          style={{ backgroundColor: circle.color ? (circle.color + "20") : "#e5e5e5" }}
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
          disabled={status === "deactivated"}
        >
          {status === "deactivated" ? "Access Removed" : "Enter Circle"}
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-2 mt-3 justify-end">
        {/* Share button - show for private non-default circles */}
        {showShareButton && circle.visibility === "private" && status === "active" && (
          <CircleShareDialog circle={circle} />
        )}

        {/* Follower manager - available for all active circles */}
        {status === "active" && <CircleAIManager circle={circle} />}

        {/* Edit button - available for all circles */}
        {status === "active" && (
          <CircleEditDialog
            circle={circle}
            onEdit={onEdit}
          />
        )}

        {/* Delete button - not available for default circles */}
        {!circle.isDefault && status === "active" && (
          <CircleDeleteDialog
            circle={circle}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
}