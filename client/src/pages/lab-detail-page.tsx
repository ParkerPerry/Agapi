import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab, Circle } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Archive,
  Beaker,
  CheckCircle,
  CircleSlash,
  Clipboard,
  FileText,
  Globe,
  Info as InfoIcon,
  Lock,
  PlayCircle,
  Plus,
  Settings,
  Trash,
  User,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import LabCircleAddDialog from "@/components/labs/lab-circle-add-dialog";
import LabCircleRoleDialog from "@/components/labs/lab-circle-role-dialog";
import LabStatusChangeDialog from "@/components/labs/lab-status-change-dialog";
import { LabContentView } from "@/components/labs/lab-content-view";
import { TourProvider } from "@/components/tour/tour-context";

interface LabCircle extends Circle {
  role: "control" | "treatment" | "observation";
}

interface CircleStats {
  labCircle: {
    id: number;
    labId: number;
    circleId: number;
    role: "control" | "treatment" | "observation";
    addedAt?: Date;
  };
  circle: Circle;
  stats: {
    postCount: number;
    followerCount: number;
    memberCount: number;
  };
}

const getExperimentTypeLabel = (type: string) => {
  switch (type) {
    case "a_b_test": return "A/B Test";
    case "multivariate": return "Multivariate";
    case "exploration": return "Exploration";
    default: return type;
  }
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("en-US", {
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

export default function LabDetailPage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("info");
  const [isAddCircleOpen, setIsAddCircleOpen] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<LabCircle | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"draft" | "active" | "completed" | "archived" | null>(null);

  // Parse the ID to number
  const labId = params.id && !isNaN(parseInt(params.id)) ? parseInt(params.id) : null;

  // Fetch lab details
  const {
    data: lab,
    isLoading: isLabLoading,
    error: labError,
    refetch: refetchLab,
  } = useQuery<Lab>({
    queryKey: [`/api/labs/${labId}`],
    enabled: !!labId
  });

  // Fetch lab circles
  const {
    data: circles,
    isLoading: isCirclesLoading,
    error: circlesError,
    refetch: refetchCircles,
  } = useQuery<LabCircle[]>({
    queryKey: [`/api/labs/${labId}/circles`],
    enabled: !!labId && activeTab === "circles",
  });
  
  // Fetch enhanced circle stats
  const {
    data: circlesWithStats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery<CircleStats[]>({
    queryKey: [`/api/labs/${labId}/circles/stats`],
    enabled: !!labId && activeTab === "circles",
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

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };
  
  const handleDeleteLab = async () => {
    try {
      if (!labId) {
        toast({
          title: "Invalid lab",
          description: "Cannot delete the lab due to an invalid lab ID.",
          variant: "destructive",
        });
        return;
      }
      
      await apiRequest(`/api/labs/${labId}`, "DELETE");
      
      toast({
        title: "Lab deleted",
        description: "The lab has been deleted successfully.",
      });
      
      navigate("/labs");
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
    refetchStats();
  };

  const handleRemoveCircle = async (circleId?: number) => {
    // Don't proceed if the circle ID is undefined, null, or invalid
    if (!circleId) {
      toast({
        title: "Invalid circle",
        description: "Cannot remove circle due to invalid reference.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest(`/api/labs/${labId}/circles/${circleId}`, "DELETE");
      
      toast({
        title: "Circle removed",
        description: "The circle has been removed from this lab.",
      });
      
      refetchCircles();
      refetchStats();
    } catch (error) {
      toast({
        title: "Failed to remove circle",
        description: "There was an error removing the circle.",
        variant: "destructive",
      });
    }
  };

  const getStatusActions = () => {
    if (!lab || !lab.status) return null;
    
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
        onClick={handleDeleteClick}
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

  // Show loading state
  if (isLabLoading) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center space-x-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/labs")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Loading Lab Details...</h1>
              </div>
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </div>
          </main>
        </div>
      </TourProvider>
    );
  }

  // Show error state
  if (labError || !lab) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center space-x-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/labs")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Lab Not Found</h1>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-semibold">Error Loading Lab Details</h2>
                    <p className="text-muted-foreground mt-2 mb-4">
                      We couldn't find the lab you're looking for. It may have been deleted or you don't have permission to access it.
                    </p>
                    <Button onClick={() => navigate("/labs")}>
                      Return to Labs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </TourProvider>
    );
  }

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="max-w-3xl mx-auto">
            {/* Header with back button */}
            <div className="flex items-center space-x-2 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate("/labs")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Beaker className="h-5 w-5" />
                  {lab.name}
                </h1>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="mr-2">
                    {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getExperimentTypeLabel(lab.experimentType)}
                  </span>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div>
              <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="circles">Circles</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
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
                          <p className="capitalize">{lab.status || "Unknown"}</p>
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
                        <div className="space-y-4">
                          {circles?.map((circle) => {
                            const stats = circlesWithStats?.find(
                              (c) => c.labCircle.circleId === circle.id
                            );
                            
                            return (
                              <Card key={circle.id} className="overflow-hidden">
                                <div className={`h-1 ${getRoleBadgeStyles(circle.role)}`} />
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-base">{circle.name}</CardTitle>
                                      <CardDescription>
                                        <Badge 
                                          variant="outline" 
                                          className={`${getRoleBadgeStyles(circle.role)} mt-1`}
                                        >
                                          {circle.role.charAt(0).toUpperCase() + circle.role.slice(1)} Group
                                        </Badge>
                                      </CardDescription>
                                    </div>
                                    <div className="space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCircle(circle);
                                          setIsRoleDialogOpen(true);
                                        }}
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Change Role
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveCircle(circle.id)}
                                      >
                                        <CircleSlash className="h-4 w-4 mr-1" />
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  {isStatsLoading ? (
                                    <p className="text-sm text-muted-foreground">Loading stats...</p>
                                  ) : statsError ? (
                                    <p className="text-sm text-destructive">Stats unavailable</p>
                                  ) : (
                                    <div className="grid grid-cols-3 gap-4 mt-2">
                                      <div>
                                        <p className="text-sm font-medium">Members</p>
                                        <p className="text-2xl">{stats?.stats.memberCount || 0}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Followers</p>
                                        <p className="text-2xl">{stats?.stats.followerCount || 0}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">Posts</p>
                                        <p className="text-2xl">{stats?.stats.postCount || 0}</p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4 pt-4">
                  <LabContentView labId={labId || 0} />
                </TabsContent>
                
                <TabsContent value="results" className="space-y-4 pt-4">
                  {/* Performance Overview Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Results Overview</CardTitle>
                      <CardDescription>
                        Overall performance of your lab experiment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-6">
                        {/* Status Banner */}
                        <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Experiment Status</h3>
                            <p className="text-sm text-muted-foreground">
                              {lab.status === "completed" 
                                ? "Completed" 
                                : "In Progress - Results are preliminary"}
                            </p>
                          </div>
                          <Badge variant={lab.status === "completed" ? "default" : "outline"}>
                            {lab.status === "completed" ? "100% Complete" : "In Progress"}
                          </Badge>
                        </div>
                        
                        {lab.successMetrics?.metrics && lab.successMetrics.metrics.length > 0 ? (
                          <div>
                            <h3 className="text-base font-medium mb-3">Performance by Metric</h3>
                            <div className="space-y-6">
                              {lab.successMetrics.metrics.map((metric, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between">
                                    <h4 className="text-sm font-medium">{metric.name}</h4>
                                    <span className="text-sm text-muted-foreground">Target: {metric.target}</span>
                                  </div>
                                  <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-primary h-2.5" 
                                      style={{ 
                                        width: '70%'
                                      }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Current: Not Yet Available</span>
                                    <span className={
                                      metric.priority === "high" 
                                        ? "text-red-500" 
                                        : metric.priority === "medium" 
                                          ? "text-amber-500" 
                                          : "text-blue-500"
                                    }>
                                      {metric.priority.charAt(0).toUpperCase() + metric.priority.slice(1)} Priority
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 border rounded-md">
                            <p className="text-muted-foreground mb-2">No metrics defined for this experiment</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveTab("info")}
                            >
                              Define Success Metrics
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Circle Comparison Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Circle Group Performance</CardTitle>
                      <CardDescription>
                        Compare performance between control and treatment groups
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {circles && circles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Control Group Column */}
                          {circles.filter(c => c.role === "control").length > 0 ? (
                            <Card className="border-blue-500/20">
                              <CardHeader className="bg-blue-500/5 pb-2">
                                <CardTitle className="text-base text-blue-600">Control Group</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="text-center py-8">
                                  <p className="text-muted-foreground">Performance data not yet available</p>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground mb-2">No control group assigned</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setActiveTab("circles")}
                                >
                                  Assign Control Group
                                </Button>
                              </CardContent>
                            </Card>
                          )}

                          {/* Treatment Group Column */}
                          {circles.filter(c => c.role === "treatment").length > 0 ? (
                            <Card className="border-purple-500/20">
                              <CardHeader className="bg-purple-500/5 pb-2">
                                <CardTitle className="text-base text-purple-600">Treatment Group</CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                <div className="text-center py-8">
                                  <p className="text-muted-foreground">Performance data not yet available</p>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <Card>
                              <CardContent className="py-8 text-center">
                                <p className="text-muted-foreground mb-2">No treatment group assigned</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setActiveTab("circles")}
                                >
                                  Assign Treatment Group
                                </Button>
                              </CardContent>
                            </Card>
                          )}

                          {/* Difference Column */}
                          <Card className="border-gray-200">
                            <CardHeader className="bg-gray-50 pb-2">
                              <CardTitle className="text-base text-gray-600">Performance Difference</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Comparative data not yet available</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-6 border rounded-md">
                          <p className="text-muted-foreground mb-2">No circles assigned to this experiment</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab("circles")}
                          >
                            Assign Circles
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Future Iterations Message */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="mt-0.5">
                          <InfoIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Coming Soon</h3>
                          <p className="text-sm text-muted-foreground">
                            Detailed insights and recommendations will be available in future updates to help you make data-driven decisions based on your experiment results.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      {/* Status change dialog */}
      {labId && targetStatus && (
        <LabStatusChangeDialog
          labId={labId}
          currentStatus={lab.status}
          newStatus={targetStatus}
          open={targetStatus !== null}
          onOpenChange={(open) => {
            if (!open) setTargetStatus(null);
          }}
          onSuccess={() => {
            refetchLab();
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lab and all of its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLab} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Circle add dialog */}
      {labId && (
        <LabCircleAddDialog
          labId={labId}
          open={isAddCircleOpen}
          onOpenChange={setIsAddCircleOpen}
          onSuccess={handleCircleUpdate}
          existingCircleIds={(circlesWithStats?.map(c => c.labCircle?.circleId || 0).filter(id => id !== 0)) || 
            (circles?.map(c => c.id).filter(id => id !== undefined) as number[]) || 
            []}
        />
      )}

      {/* Circle role dialog */}
      {labId && selectedCircle && selectedCircle.id && (
        <LabCircleRoleDialog
          labId={labId}
          circleId={selectedCircle.id}
          circleName={selectedCircle.name || "Unknown Circle"}
          currentRole={selectedCircle.role || "observation"}
          open={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          onSuccess={handleCircleUpdate}
        />
      )}
    </TourProvider>
  );
}