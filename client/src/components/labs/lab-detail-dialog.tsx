import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab, Circle } from "@shared/schema";
import { 
  Info, 
  Users, 
  BarChart3, 
  Plus, 
  Trash, 
  ArrowUpToLine,
  PlayCircle, 
  CheckCircle, 
  Archive
} from "lucide-react";
import LabCircleAddDialog from "./lab-circle-add-dialog";
import LabCircleRoleDialog from "./lab-circle-role-dialog";

interface LabDetailDialogProps {
  labId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const LabDetailDialog = ({ labId, open, onOpenChange, onUpdate }: LabDetailDialogProps) => {
  const { toast } = useToast();
  const [addCircleDialogOpen, setAddCircleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<{ id: number, role: string } | null>(null);

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
  } = useQuery<(Circle & { role: string })[]>({
    queryKey: [`/api/labs/${labId}/circles`],
    enabled: open && !!labId,
  });

  // When the dialog opens, refresh data
  useEffect(() => {
    if (open && labId) {
      refetchLab();
      refetchCircles();
    }
  }, [open, labId, refetchLab, refetchCircles]);

  const handleStatusChange = async (newStatus: "draft" | "active" | "completed" | "archived") => {
    try {
      await apiRequest(`/api/labs/${labId}/status`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      
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
    }
  };

  const handleRemoveCircle = async (circleId: number) => {
    try {
      await apiRequest(`/api/labs/${labId}/circles/${circleId}`, {
        method: "DELETE",
      });
      
      toast({
        title: "Circle removed",
        description: "Circle removed from lab successfully.",
      });
      
      refetchCircles();
    } catch (error) {
      toast({
        title: "Failed to remove circle",
        description: "There was an error removing the circle from the lab.",
        variant: "destructive",
      });
    }
  };

  const handleEditCircleRole = (circleId: number, currentRole: string) => {
    setSelectedCircle({ id: circleId, role: currentRole });
    setEditRoleDialogOpen(true);
  };

  // After adding or updating a circle, refresh the circles list
  const handleCircleChange = () => {
    refetchCircles();
  };

  const getCircleCountByRole = (role: string) => {
    return circles?.filter(circle => circle.role === role).length || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Lab Details</DialogTitle>
        </DialogHeader>

        {isLabLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading lab details...</p>
          </div>
        ) : labError ? (
          <div className="text-center py-6 text-destructive">
            <p>Failed to load lab details. Please try again.</p>
          </div>
        ) : lab ? (
          <>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <h2 className="text-2xl font-bold">{lab.name}</h2>
              <Badge variant="outline" className={getStatusColor(lab.status)}>
                {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {lab.status !== "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("active")}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Activate
                </Button>
              )}
              {lab.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              )}
              {lab.status !== "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("draft")}
                >
                  <ArrowUpToLine className="mr-2 h-4 w-4" />
                  Return to Draft
                </Button>
              )}
              {lab.status !== "archived" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("archived")}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              )}
            </div>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="info">
                  <Info className="mr-2 h-4 w-4" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="circles">
                  <Users className="mr-2 h-4 w-4" />
                  Circles
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lab Information</CardTitle>
                    <CardDescription>
                      Basic details about this experiment lab
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Experiment Type
                        </h4>
                        <p>
                          {lab.experimentType === "a_b_test" && "A/B Test"}
                          {lab.experimentType === "multivariate" && "Multivariate"}
                          {lab.experimentType === "exploration" && "Exploration"}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Created
                        </h4>
                        <p>{formatDate(lab.createdAt)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Last Updated
                        </h4>
                        <p>{formatDate(lab.updatedAt)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Description
                      </h4>
                      <p className="whitespace-pre-line">
                        {lab.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Goals
                      </h4>
                      <p className="whitespace-pre-line">
                        {lab.goals || "No goals defined."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="circles" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Circles</CardTitle>
                        <CardDescription>
                          Circles associated with this lab
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddCircleDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Circle
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isCirclesLoading ? (
                      <div className="text-center py-4">Loading circles...</div>
                    ) : circlesError ? (
                      <div className="text-center py-4 text-destructive">
                        Failed to load circles.
                      </div>
                    ) : circles?.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No circles added to this lab yet.
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-3 mb-4">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                            Control: {getCircleCountByRole("control")}
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500">
                            Treatment: {getCircleCountByRole("treatment")}
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                            Observation: {getCircleCountByRole("observation")}
                          </Badge>
                        </div>
                      
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {circles?.map((circle) => (
                              <TableRow key={circle.id}>
                                <TableCell className="font-medium">
                                  {circle.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={
                                    circle.role === "control" ? "bg-blue-500/10 text-blue-500" :
                                    circle.role === "treatment" ? "bg-green-500/10 text-green-500" :
                                    "bg-purple-500/10 text-purple-500"
                                  }>
                                    {circle.role.charAt(0).toUpperCase() + circle.role.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCircleRole(circle.id, circle.role)}
                                  >
                                    Edit Role
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleRemoveCircle(circle.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Success Metrics</CardTitle>
                    <CardDescription>
                      Metrics used to evaluate experiment success
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!lab.successMetrics?.metrics || lab.successMetrics.metrics.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No success metrics defined for this lab.
                      </div>
                    ) : (
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
                              <TableCell className="font-medium">
                                {metric.name}
                              </TableCell>
                              <TableCell>{metric.target}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  metric.priority === "high" ? "bg-red-500/10 text-red-500" :
                                  metric.priority === "medium" ? "bg-amber-500/10 text-amber-500" :
                                  "bg-blue-500/10 text-blue-500"
                                }>
                                  {metric.priority.charAt(0).toUpperCase() + metric.priority.slice(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-6">
            <p>No lab data found.</p>
          </div>
        )}
      </DialogContent>

      {lab && (
        <>
          <LabCircleAddDialog
            labId={labId}
            open={addCircleDialogOpen}
            onOpenChange={setAddCircleDialogOpen}
            onAddCircle={handleCircleChange}
          />

          {selectedCircle && (
            <LabCircleRoleDialog
              labId={labId}
              circleId={selectedCircle.id}
              initialRole={selectedCircle.role as "control" | "treatment" | "observation"}
              open={editRoleDialogOpen}
              onOpenChange={setEditRoleDialogOpen}
              onRoleUpdate={handleCircleChange}
            />
          )}
        </>
      )}
    </Dialog>
  );
};

export default LabDetailDialog;