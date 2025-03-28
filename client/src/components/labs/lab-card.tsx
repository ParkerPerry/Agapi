import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lab } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  PlayCircle,
  CheckCircle,
  Archive,
  Trash,
  Edit,
  Info,
} from "lucide-react";
import LabDeleteDialog from "./lab-delete-dialog";
import LabDetailDialog from "./lab-detail-dialog";
import LabStatusChangeDialog from "./lab-status-change-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface LabCardProps {
  lab: Lab;
  onUpdate: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    case "active": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    case "completed": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "archived": return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20";
    default: return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20";
  }
};

const getExperimentTypeLabel = (type: string) => {
  switch (type) {
    case "a_b_test": return "A/B Test";
    case "multivariate": return "Multivariate";
    case "exploration": return "Exploration";
    default: return type;
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const LabCard = ({ lab, onUpdate }: LabCardProps) => {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"active" | "draft" | "completed" | "archived" | null>(null);

  const handleOpenStatusDialog = (newStatus: "active" | "draft" | "completed" | "archived") => {
    setTargetStatus(newStatus);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSuccess = () => {
    onUpdate();
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/api/labs/${lab.id}`, "DELETE");
      
      toast({
        title: "Lab deleted",
        description: "The lab has been deleted successfully.",
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to delete lab",
        description: "There was an error deleting the lab.",
        variant: "destructive",
      });
    }
  };

  const getStatusActions = () => {
    const actions = [];
    
    if (lab.status !== "active") {
      actions.push(
        <DropdownMenuItem 
          key="activate"
          onClick={() => handleOpenStatusDialog("active")}
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          Activate
        </DropdownMenuItem>
      );
    }
    
    if (lab.status !== "completed") {
      actions.push(
        <DropdownMenuItem 
          key="complete"
          onClick={() => handleOpenStatusDialog("completed")}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Complete
        </DropdownMenuItem>
      );
    }
    
    if (lab.status !== "archived" && lab.status !== "draft") {
      actions.push(
        <DropdownMenuItem 
          key="archive"
          onClick={() => handleOpenStatusDialog("archived")}
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
      );
    }

    return actions;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{lab.name}</CardTitle>
              <CardDescription>
                {getExperimentTypeLabel(lab.experimentType)} • Created {formatDate(lab.createdAt)}
              </CardDescription>
            </div>
            <Badge variant="outline" className={getStatusColor(lab.status)}>
              {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {lab.description || "No description provided."}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDetailDialogOpen(true)}
          >
            <Info className="mr-2 h-4 w-4" />
            Details
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {getStatusActions()}
              
              <DropdownMenuItem onClick={() => setIsDetailDialogOpen(true)}>
                <Info className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <LabDeleteDialog
        lab={lab}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={handleDelete}
      />
      
      <LabDetailDialog
        labId={lab.id}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onUpdate={onUpdate}
      />
      
      {targetStatus && (
        <LabStatusChangeDialog
          labId={lab.id}
          currentStatus={lab.status}
          newStatus={targetStatus}
          open={isStatusDialogOpen}
          onOpenChange={(open) => {
            setIsStatusDialogOpen(open);
            if (!open) setTargetStatus(null);
          }}
          onSuccess={handleStatusSuccess}
        />
      )}
    </>
  );
};

export default LabCard;