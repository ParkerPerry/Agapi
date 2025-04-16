import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab, Circle } from "@shared/schema";
import { NavBar } from "@/components/nav-bar";
import LabGoalsEditor from "@/components/labs/lab-goals-editor";
import { LabResultsTab } from "@/components/labs/lab-results-tab";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  
  /**
   * Handle updating lab goals and metrics
   */
  const handleGoalsUpdate = async (goals: string, successMetrics: { metrics: Array<{name: string, target: string, priority: "high" | "medium" | "low"}> }) => {
    if (!labId) {
      toast({
        title: "Invalid lab",
        description: "Cannot update goals due to an invalid lab ID.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest(`/api/labs/${labId}`, "PATCH", {
        goals,
        successMetrics
      });
      
      toast({
        title: "Goals updated",
        description: "Lab goals and metrics have been updated successfully.",
      });
      
      refetchLab();
    } catch (error) {
      toast({
        title: "Failed to update goals",
        description: "There was an error updating the lab goals and metrics.",
        variant: "destructive",
      });
      throw error; // Re-throw to allow the calling component to handle it
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
                                  <TableCell className="font-medium">{metric.name}</TableCell>
                                  <TableCell>{metric.target}</TableCell>
                                  <TableCell>
                                    <Badge variant={metric.priority === "high" ? "default" : (metric.priority === "medium" ? "secondary" : "outline")}>
                                      {metric.priority}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4 pt-0">
                      <LabGoalsEditor 
                        lab={lab} 
                        onSave={handleGoalsUpdate}
                      />
                      
                      <div className="w-full border-t mt-2 pt-4">
                        <h3 className="text-base font-medium mb-2">Status Management</h3>
                        {getStatusActions()}
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="circles" className="space-y-4 pt-4">
                  {isCirclesLoading || isStatsLoading ? (
                    <Card>
                      <CardContent className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ) : circlesError || statsError ? (
                    <Card>
                      <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                          <h2 className="text-xl font-semibold">Error Loading Circles</h2>
                          <p className="text-muted-foreground mt-2 mb-4">
                            There was an error loading the lab circles. Please try again later.
                          </p>
                          <Button onClick={() => {
                            refetchCircles();
                            refetchStats();
                          }}>
                            Retry
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : !circles?.length ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Circles</CardTitle>
                        <CardDescription>
                          Circles assigned to this lab for testing
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground mb-6">No circles have been added to this lab yet</p>
                        <Button 
                          className="gap-1"
                          onClick={() => setIsAddCircleOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Circle
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-1">
                          <Users className="h-5 w-5" />
                          Lab Circles ({circles.length})
                        </h2>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => setIsAddCircleOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Circle
                        </Button>
                      </div>
                      
                      {circlesWithStats?.map((circleWithStats) => {
                        const { circle, labCircle, stats } = circleWithStats;
                        const roleBadgeStyle = getRoleBadgeStyles(labCircle.role);
                        
                        return (
                          <Card key={circle.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    {circle.name}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {circle.description || "No description"}
                                  </CardDescription>
                                </div>
                                <Badge className={roleBadgeStyle}>
                                  {labCircle.role.charAt(0).toUpperCase() + labCircle.role.slice(1)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between">
                                <div className="grid grid-cols-3 gap-4 mt-3">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Posts</p>
                                    <p className="text-xl font-semibold">{stats.postCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Followers</p>
                                    <p className="text-xl font-semibold">{stats.followerCount}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Members</p>
                                    <p className="text-xl font-semibold">{stats.memberCount}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCircle({
                                        ...circle,
                                        role: labCircle.role
                                      });
                                      setIsRoleDialogOpen(true);
                                    }}
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Role
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveCircle(circle.id)}
                                  >
                                    <CircleSlash className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4 pt-4">
                  <LabContentView labId={labId || 0} />
                </TabsContent>
                
                <TabsContent value="results" className="space-y-4 pt-4">
                  <LabResultsTab lab={lab} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      {/* Status change dialog */}
      {targetStatus && (
        <LabStatusChangeDialog
          open={!!targetStatus}
          onOpenChange={() => setTargetStatus(null)}
          onConfirm={() => {
            if (targetStatus) {
              handleStatusChange(targetStatus);
            }
            setTargetStatus(null);
          }}
          status={targetStatus}
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lab?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lab
              and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteLab}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Circle Dialog */}
      <LabCircleAddDialog
        open={isAddCircleOpen}
        onOpenChange={setIsAddCircleOpen}
        labId={labId || 0}
        onAddSuccess={handleCircleUpdate}
      />
      
      {/* Circle Role Dialog */}
      {selectedCircle && (
        <LabCircleRoleDialog
          open={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          labId={labId || 0}
          circleId={selectedCircle.id}
          circleName={selectedCircle.name}
          currentRole={selectedCircle.role}
          onUpdateSuccess={handleCircleUpdate}
        />
      )}
    </TourProvider>
  );
}