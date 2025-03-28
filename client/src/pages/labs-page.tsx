import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { useCreateLab, useDeleteLab } from "@/lib/mutations/lab-mutations";
import { useLabs, Lab } from "@/lib/queries/lab-queries";
import { useCircles } from "../lib/queries/circle-queries";
import type { Circle } from "../lib/queries/circle-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircleIcon,
  FlaskConicalIcon,
  BeakerIcon,
  TrashIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckIcon,
  PencilIcon,
  Search,
  RefreshCw,
  Filter,
  X
} from "lucide-react";
import { formatRelativeTime } from "@/utils/date";

export default function LabsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: labs, isLoading: isLabsLoading, isError: isLabsError } = useLabs();
  const { data: circles, isLoading: isCirclesLoading } = useCircles();
  const [activeTab, setActiveTab] = useState("view");
  
  // Form state for creating a new lab
  const [labName, setLabName] = useState("");
  const [labDescription, setLabDescription] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<string>("");
  
  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "active" | "completed">("all");
  
  const { toast } = useToast();
  
  const createLabMutation = useCreateLab();
  const deleteLabMutation = useDeleteLab();
  
  // Redirect to login if no user
  if (!user) {
    return null;
  }
  
  const handleCreateLab = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!labName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a name for your lab.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCircleId) {
      toast({
        title: "Missing information",
        description: "Please select a circle for your lab.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createLabMutation.mutateAsync({
        name: labName,
        description: labDescription,
        circleId: parseInt(selectedCircleId),
      });
      
      // Reset form
      setLabName("");
      setLabDescription("");
      setSelectedCircleId("");
      
      // Switch to view labs tab
      setActiveTab("view");
      
      toast({
        title: "Lab created",
        description: "Your new lab has been created successfully.",
      });
      
      // Navigate to the new lab detail page
      if (result && result.id) {
        navigate(`/labs/${result.id}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create the lab. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteLab = async (labId: number) => {
    if (!confirm("Are you sure you want to delete this lab?")) {
      return;
    }
    
    try {
      await deleteLabMutation.mutateAsync(labId);
      
      toast({
        title: "Lab deleted",
        description: "The lab has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the lab. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter labs based on search query and status filter
  const filteredLabs = useMemo(() => {
    if (!labs) return [];
    
    return labs.filter(lab => {
      // Status filter
      if (statusFilter !== "all" && lab.status !== statusFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch = lab.name.toLowerCase().includes(query);
        const descriptionMatch = lab.description?.toLowerCase().includes(query) || false;
        const statusMatch = lab.status.toLowerCase().includes(query);
        const circleNameMatch = lab.circleName?.toLowerCase().includes(query) || false;
        
        if (!(nameMatch || descriptionMatch || statusMatch || circleNameMatch)) {
          return false;
        }
      }
      
      return true;
    });
  }, [labs, searchQuery, statusFilter]);
  
  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <PencilIcon className="h-4 w-4 text-gray-500" />;
      case "active":
        return <PlayIcon className="h-4 w-4 text-green-500" />;
      case "completed":
        return <CheckIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "active":
        return "Active";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };
  
  if (isLabsError) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-4 px-2 md:px-4">
          <div className="text-center bg-red-50 p-4 rounded-md mb-4">
            <h2 className="text-lg font-medium text-red-600">Error Loading Labs</h2>
            <p className="text-red-500">There was a problem loading your labs. Please try refreshing the page.</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-4 px-2 md:px-4">
        <div className="space-y-4 max-w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">AI Labs</h1>
              <p className="text-muted-foreground">
                Setup experiments to analyze AI follower interactions
              </p>
            </div>
          </div>
          
          {/* Main content tabs */}
          <Card>
            <CardHeader>
              <Tabs defaultValue="view" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="view">View Labs</TabsTrigger>
                  <TabsTrigger value="create">Create New Lab</TabsTrigger>
                </TabsList>
                
                {/* View Labs Tab */}
                <TabsContent value="view" className="mt-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <CardTitle>Labs</CardTitle>
                    
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search labs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 w-full"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={statusFilter}
                          onValueChange={(value: "all" | "draft" | "active" | "completed") => setStatusFilter(value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={clearFilters}
                          title="Clear filters"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Display filter badges */}
                  {(searchQuery || statusFilter !== "all") && (
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                      <div className="text-sm text-muted-foreground">Filters:</div>
                      {searchQuery && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Search: "{searchQuery}"
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => setSearchQuery("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                      {statusFilter !== "all" && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          Status: {statusFilter}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0 ml-1" 
                            onClick={() => setStatusFilter("all")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {isLabsLoading ? (
                    <div className="text-center py-8">
                      <FlaskConicalIcon className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
                      <p className="mt-4 text-gray-600">Loading labs...</p>
                    </div>
                  ) : filteredLabs.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {filteredLabs.map((lab) => (
                        <Card key={lab.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl">{lab.name}</CardTitle>
                                <CardDescription className="mt-1">
                                  {lab.description || "No description"}
                                </CardDescription>
                              </div>
                              <div className="flex items-center px-2 py-1 rounded-full bg-gray-100">
                                {getStatusIcon(lab.status)}
                                <span className="ml-1 text-xs font-medium">
                                  {getStatusText(lab.status)}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Circle:</span>
                                <span className="font-medium">{lab.circleName || `ID: ${lab.circleId}`}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Created:</span>
                                <span>{formatRelativeTime(lab.createdAt)}</span>
                              </div>
                              {lab.metrics && (
                                <div className="mt-4 pt-3 border-t border-gray-100">
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                      <div className="text-lg font-semibold">{lab.metrics.postCount}</div>
                                      <div className="text-xs text-muted-foreground">Posts</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-semibold">{lab.metrics.commentCount}</div>
                                      <div className="text-xs text-muted-foreground">Comments</div>
                                    </div>
                                    <div>
                                      <div className="text-lg font-semibold">{lab.metrics.followerCount}</div>
                                      <div className="text-xs text-muted-foreground">Followers</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteLab(lab.id)}
                              disabled={deleteLabMutation.isPending}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => navigate(`/labs/${lab.id}`)}
                            >
                              <span>View Lab</span>
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {labs?.length ? (
                        <div>
                          <p className="text-muted-foreground">No labs match your filters</p>
                          <Button className="mt-4" variant="outline" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <BeakerIcon className="h-20 w-20 mx-auto text-gray-300" />
                          <p className="mt-4 text-muted-foreground">No labs found. Create one to get started!</p>
                          <Button className="mt-4" onClick={() => setActiveTab("create")}>
                            <PlusCircleIcon className="mr-2 h-4 w-4" />
                            Create Your First Lab
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Results count indicator */}
                  {filteredLabs.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-4 text-right">
                      {filteredLabs.length} labs {filteredLabs.length !== labs?.length && `(out of ${labs?.length})`}
                    </div>
                  )}
                </TabsContent>
                
                {/* Create Lab Tab */}
                <TabsContent value="create" className="mt-4">
                  <CardTitle className="mb-4">Create New Lab</CardTitle>
                  <form onSubmit={handleCreateLab}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={labName}
                          onChange={(e) => setLabName(e.target.value)}
                          placeholder="Enter lab name"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={labDescription}
                          onChange={(e) => setLabDescription(e.target.value)}
                          placeholder="Enter optional description"
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="circle" className="text-right">
                          Circle
                        </Label>
                        <Select
                          value={selectedCircleId}
                          onValueChange={setSelectedCircleId}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a circle" />
                          </SelectTrigger>
                          <SelectContent>
                            {isCirclesLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading circles...
                              </SelectItem>
                            ) : circles && circles.length > 0 ? (
                              circles.map((circle: Circle) => (
                                <SelectItem key={circle.id} value={circle.id.toString()}>
                                  {circle.name || `Circle #${circle.id}`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No circles available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end mt-6">
                        <Button 
                          type="submit" 
                          disabled={createLabMutation.isPending}
                        >
                          {createLabMutation.isPending ? "Creating..." : "Create Lab"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}