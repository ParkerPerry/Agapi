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
        "flex flex-col space-y-4 p-4 border rounded-lg",
        circle.isDefault && "bg-muted"
      )}
      style={{ borderColor: circle.color }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
            style={{ backgroundColor: circle.color + "20" }}
          >
            {circle.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{circle.name}</h3>
              {circle.isDefault && (
                <Badge variant="secondary">Default</Badge>
              )}
              <Badge
                variant={circle.visibility === "shared" ? "default" : "outline"}
              >
                {circle.visibility}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {circle.description}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="default"
            onClick={() => navigate(`/?circle=${circle.id}`)}
          >
            Enter Circle
          </Button>

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
    </div>
  );
}
