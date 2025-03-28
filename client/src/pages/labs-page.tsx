import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateLab, useDeleteLab } from "@/lib/mutations/lab-mutations";
import { useLabs } from "@/lib/queries/lab-queries";
import { useCircles } from "@/lib/queries/circle-queries";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircleIcon,
  FlaskConicalIcon,
  BeakerIcon,
  TrashIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckIcon,
  PencilIcon
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/utils/date";

export default function LabsPage() {
  const [, navigate] = useLocation();
  const { data: labs, isLoading: isLabsLoading, isError: isLabsError } = useLabs();
  const { data: circles, isLoading: isCirclesLoading } = useCircles();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [labName, setLabName] = useState("");
  const [labDescription, setLabDescription] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<string>("");
  const { toast } = useToast();
  
  const createLabMutation = useCreateLab();
  const deleteLabMutation = useDeleteLab();
  
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
      
      setIsCreateDialogOpen(false);
      setLabName("");
      setLabDescription("");
      setSelectedCircleId("");
      
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
  
  const renderCreateLabDialog = () => {
    return (
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center">
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Create New Lab
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleCreateLab}>
            <DialogHeader>
              <DialogTitle>Create New Lab</DialogTitle>
              <DialogDescription>
                Set up a new lab to explore AI follower interactions with controlled experiments.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                      circles.map(circle => (
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
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createLabMutation.isPending}
              >
                {createLabMutation.isPending ? "Creating..." : "Create Lab"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
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
      <div className="container mx-auto py-8">
        <div className="text-center bg-red-50 p-4 rounded-md mb-4">
          <h2 className="text-lg font-medium text-red-600">Error Loading Labs</h2>
          <p className="text-red-500">There was a problem loading your labs. Please try refreshing the page.</p>
        </div>
        {renderCreateLabDialog()}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Labs</h1>
          <p className="text-muted-foreground">
            Setup experiments to analyze AI follower interactions
          </p>
        </div>
        {renderCreateLabDialog()}
      </div>
      
      {isLabsLoading ? (
        <div className="text-center py-8">
          <FlaskConicalIcon className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-600">Loading labs...</p>
        </div>
      ) : labs && labs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labs.map((lab) => (
            <Card key={lab.id} className="overflow-hidden">
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
                    <span>{formatRelativeTime(new Date(lab.createdAt))}</span>
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
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">No Labs Yet</CardTitle>
            <CardDescription className="text-center">
              Create your first lab to start experimenting with AI followers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <BeakerIcon className="h-20 w-20 text-gray-300" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Create Your First Lab
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}