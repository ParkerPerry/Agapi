import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab, Circle } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Beaker,
  CheckCircle,
  CircleSlash,
  Clipboard,
  PlayCircle,
  Plus,
  Settings,
  Trash,
} from "lucide-react";
import LabCircleAddDialog from "./lab-circle-add-dialog";
import LabCircleRoleDialog from "./lab-circle-role-dialog";
import LabStatusChangeDialog from "./lab-status-change-dialog";

interface LabDetailDialogProps {
  labId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

interface LabCircle extends Circle {
  role: "control" | "treatment" | "observation";
}

const getExperimentTypeLabel = (type: string) => {
  switch (type) {
    case "a_b_test": return "A/B Test";
    case "multivariate": return "Multivariate";
    case "exploration": return "Exploration";
    default: return type;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getRoleBadgeStyles = (role: string) => {
  switch (role) {
    case "control": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "treatment": return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    case "observation": return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    default: return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
};

const LabDetailDialog = ({
  labId,
  open,
  onOpenChange,
  onUpdate,
}: LabDetailDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [isAddCircleOpen, setIsAddCircleOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<LabCircle | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"draft" | "active" | "completed" | "archived" | null>(null);

  // Fetch lab details
  const {
    data: lab,
    isLoading: isLabLoading,
    error: labError,
    refetch: refetchLab,
  } = useQuery<Lab>({
    queryKey: [`/api/labs/${labId}`],
    enabled: open && !!labId,
  });

  // Fetch lab circles
  const {
    data: circles,
    isLoading: isCirclesLoading,
    error: circlesError,
    refetch: refetchCircles,
  } = useQuery<LabCircle[]>({
    queryKey: [`/api/labs/${labId}/circles`],
    enabled: open && !!labId && activeTab === "circles",
  });

  const handleStatusChange = async (newStatus: "active" | "draft" | "completed" | "archived") => {
    if (isUpdatingStatus || !lab) return;
    
    setIsUpdatingStatus(true);
    try {
      await apiRequest(`/api/labs/${labId}/status`, "PATCH", { status: newStatus });
      
      toast({
        title: "Status updated",
        description: `Lab status changed to ${newStatus}.`,
      });
      
      refetchLab();
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: "There was an error updating the lab status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteLab = async () => {
    try {
      await apiRequest(`/api/labs/${labId}`, "DELETE");
      
      toast({
        title: "Lab deleted",
        description: "The lab has been deleted successfully.",
      });
      
      onOpenChange(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to delete lab",
        description: "There was an error deleting the lab.",
        variant: "destructive",
      });
    }
  };

  const handleCircleUpdate = () => {
    refetchCircles();
    onUpdate();
  };

  const handleRemoveCircle = async (circleId: number) => {
    try {
      await apiRequest(`/api/labs/${labId}/circles/${circleId}`, "DELETE");
      
      toast({
        title: "Circle removed",
        description: "The circle has been removed from this lab.",
      });
      
      refetchCircles();
      onUpdate();
    } catch (error) {
      toast({
        title: "Failed to remove circle",
        description: "There was an error removing the circle.",
        variant: "destructive",
      });
    }
  };

  const getStatusActions = () => {
    if (!lab) return null;
    
    const actions = [];
    
    if (lab.status !== "active") {
      actions.push(
        <Button 
          key="activate"
          variant="outline" 
          onClick={() => setTargetStatus("active")}
          className="flex items-center gap-2"
        >
          <PlayCircle className="h-4 w-4" />
          Activate
        </Button>
      );
    }
    
    if (lab.status !== "completed") {
      actions.push(
        <Button 
          key="complete"
          variant="outline" 
          onClick={() => setTargetStatus("completed")}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Complete
        </Button>
      );
    }
    
    if (lab.status !== "archived" && lab.status !== "draft") {
      actions.push(
        <Button 
          key="archive"
          variant="outline" 
          onClick={() => setTargetStatus("archived")}
          className="flex items-center gap-2"
        >
          <Archive className="h-4 w-4" />
          Archive
        </Button>
      );
    }
    
    actions.push(
      <Button 
        key="delete"
        variant="destructive" 
        onClick={handleDeleteLab}
        className="flex items-center gap-2"
      >
        <Trash className="h-4 w-4" />
        Delete
      </Button>
    );

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {actions}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              {isLabLoading ? "Loading..." : lab?.name}
            </DialogTitle>
            <DialogDescription>
              {lab && <Badge variant="outline">{lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}</Badge>}
            </DialogDescription>
          </DialogHeader>

          {isLabLoading ? (
            <div className="py-8 text-center">
              <p>Loading lab details...</p>
            </div>
          ) : labError ? (
            <div className="py-8 text-center">
              <p className="text-destructive">Failed to load lab details.</p>
              <Button 
                variant="outline" 
                onClick={() => refetchLab()}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : lab ? (
            <div>
              <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="circles">Circles</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lab Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-semibold">Experiment Type</h4>
                          <p>{getExperimentTypeLabel(lab.experimentType)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Created</h4>
                          <p>{formatDate(lab.createdAt)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Last Updated</h4>
                          <p>{formatDate(lab.updatedAt)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Status</h4>
                          <p className="capitalize">{lab.status}</p>
                        </div>
                      </div>
                      
                      {lab.description && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {lab.description}
                          </p>
                        </div>
                      )}
                      
                      {lab.goals && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Goals</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {lab.goals}
                          </p>
                        </div>
                      )}
                      
                      {lab.successMetrics?.metrics && lab.successMetrics.metrics.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Success Metrics</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead>Target</TableHead>
                                <TableHead>Priority</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lab.successMetrics.metrics.map((metric, index) => (
                                <TableRow key={index}>
                                  <TableCell>{metric.name}</TableCell>
                                  <TableCell>{metric.target}</TableCell>
                                  <TableCell className="capitalize">{metric.priority}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex-col items-start">
                      <h4 className="text-sm font-semibold mb-2">Lab Management</h4>
                      {getStatusActions()}
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="circles" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Circle Assignment</CardTitle>
                        <CardDescription>
                          Assign circles to different roles in your experiment
                        </CardDescription>
                      </div>
                      <Button onClick={() => setIsAddCircleOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Circle
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isCirclesLoading ? (
                        <div className="py-8 text-center">
                          <p>Loading circles...</p>
                        </div>
                      ) : circlesError ? (
                        <div className="py-8 text-center">
                          <p className="text-destructive">Failed to load circles.</p>
                          <Button 
                            variant="outline" 
                            onClick={() => refetchCircles()}
                            className="mt-4"
                          >
                            Retry
                          </Button>
                        </div>
                      ) : circles?.length === 0 ? (
                        <div className="py-8 text-center border rounded-md bg-muted/20">
                          <p className="text-muted-foreground mb-4">
                            No circles assigned to this lab yet.
                          </p>
                          <Button onClick={() => setIsAddCircleOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Circle
                          </Button>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Circle</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {circles?.map((circle) => (
                              <TableRow key={circle.id}>
                                <TableCell>
                                  <div className="font-medium">{circle.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {circle.description?.substring(0, 50) || "No description"}
                                    {circle.description && circle.description.length > 50 ? "..." : ""}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={getRoleBadgeStyles(circle.role)}
                                  >
                                    {circle.role.charAt(0).toUpperCase() + circle.role.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedCircle(circle);
                                        setIsRoleDialogOpen(true);
                                      }}
                                      title="Change role"
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveCircle(circle.id)}
                                      className="text-destructive"
                                      title="Remove from lab"
                                    >
                                      <CircleSlash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">
                        <strong>Control:</strong> Baseline group with standard content<br />
                        <strong>Treatment:</strong> Experimental group with modified content<br />
                        <strong>Observation:</strong> Circle members can view but not participate
                      </p>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Circle dialogs */}
      {lab && (
        <>
          <LabCircleAddDialog
            labId={labId}
            open={isAddCircleOpen}
            onOpenChange={setIsAddCircleOpen}
            onSuccess={handleCircleUpdate}
            existingCircleIds={circles?.map(c => c.id) || []}
          />
          
          {selectedCircle && (
            <LabCircleRoleDialog
              labId={labId}
              circleId={selectedCircle.id}
              currentRole={selectedCircle.role}
              circleName={selectedCircle.name}
              open={isRoleDialogOpen}
              onOpenChange={setIsRoleDialogOpen}
              onSuccess={handleCircleUpdate}
            />
          )}
          
          {targetStatus && (
            <LabStatusChangeDialog
              labId={labId}
              currentStatus={lab.status}
              newStatus={targetStatus}
              open={!!targetStatus}
              onOpenChange={(open) => {
                if (!open) setTargetStatus(null);
              }}
              onSuccess={() => {
                refetchLab();
                onUpdate();
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default LabDetailDialog;