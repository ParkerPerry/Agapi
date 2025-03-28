import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Lab, InsertLab } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/ui/container";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Save,
  PlayCircle,
  SquareCheck,
  FlaskConical,
  RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  CircleFollowerManagerWrapper 
} from "@/components/circles/circle-follower-manager-wrapper";
import { LabPostForm } from "@/components/labs/lab-post-form";
import { LabPostsList } from "@/components/labs/lab-posts-list";
import { LabStats } from "@/components/labs/lab-stats";

export default function LabDetailPage() {
  const params = useParams<{ id: string }>;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("circle");
  const [isCreating, setIsCreating] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  
  // Check if we're on the create route
  const [isCreateRoute] = useRoute("/labs/create");
  const isNewLab = isCreateRoute || params().id === "new";
  const labId = isNewLab ? null : parseInt(params().id);

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100),
    description: z.string().optional(),
    circleId: z.number().positive("Please select a circle"),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      circleId: 0,
    }
  });

  // Fetch lab data if editing
  const { data: lab, isLoading } = useQuery<Lab>({
    queryKey: [`/api/labs/${labId}`],
    queryFn: async () => {
      if (isNewLab) return null;
      return await apiRequest(`/api/labs/${labId}`);
    },
    onSuccess: (data) => {
      if (data) {
        // Update form values and tab based on lab status
        form.reset({
          name: data.name,
          description: data.description || "",
          circleId: data.circleId,
        });
        
        setSelectedCircleId(data.circleId);
        
        // Set active tab based on lab status
        if (data.status === "active" || data.status === "completed") {
          setActiveTab("stats");
        }
      }
    },
  });

  // Create lab mutation
  const createLabMutation = useMutation({
    mutationFn: async (data: InsertLab) => {
      setIsCreating(true);
      return await apiRequest("/api/labs", "POST", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      
      toast({
        title: "Lab created",
        description: "Your lab has been created successfully."
      });
      
      setIsCreating(false);
      
      // Navigate to the lab detail page
      navigate(`/labs/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create lab. Please try again.",
        variant: "destructive"
      });
      
      setIsCreating(false);
    }
  });

  // Update lab mutation
  const updateLabMutation = useMutation({
    mutationFn: async (data: Partial<InsertLab>) => {
      setIsSaving(true);
      return await apiRequest(`/api/labs/${labId}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${labId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      
      toast({
        title: "Lab updated",
        description: "Your lab has been updated successfully."
      });
      
      setIsSaving(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lab. Please try again.",
        variant: "destructive"
      });
      
      setIsSaving(false);
    }
  });

  // Launch lab mutation
  const launchLabMutation = useMutation({
    mutationFn: async () => {
      setIsLaunching(true);
      return await apiRequest(`/api/labs/${labId}/launch`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${labId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      
      toast({
        title: "Lab launched",
        description: "Your lab has been launched successfully."
      });
      
      setIsLaunching(false);
      
      // Set active tab to stats
      setActiveTab("stats");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to launch lab. Please try again.",
        variant: "destructive"
      });
      
      setIsLaunching(false);
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isNewLab) {
      createLabMutation.mutate(values as InsertLab);
    } else {
      updateLabMutation.mutate(values);
    }
  };

  // Update circleId when a circle is selected
  useEffect(() => {
    if (selectedCircleId) {
      form.setValue("circleId", selectedCircleId);
    }
  }, [selectedCircleId, form]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle lab launch
  const handleLabLaunch = () => {
    // Check if there are any posts
    if (labId) {
      launchLabMutation.mutate();
    }
  };

  // Handle circle selection
  const handleCircleSelected = (circleId: number) => {
    setSelectedCircleId(circleId);
  };

  // Loading state
  if (isLoading && !isNewLab) {
    return (
      <Container className="py-8">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/labs")}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isNewLab ? "Create New Lab" : lab?.name}
            </h1>
            <p className="text-muted-foreground">
              {isNewLab 
                ? "Set up a new experiment with AI followers" 
                : lab?.description}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isNewLab && lab?.status === "draft" && (
            <Button 
              onClick={handleLabLaunch}
              disabled={isLaunching}
            >
              {isLaunching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Launch Lab
            </Button>
          )}
          
          {!isNewLab && lab?.status === "active" && (
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          )}
          
          {!isNewLab && lab?.status === "completed" && (
            <Button variant="secondary" disabled>
              <SquareCheck className="h-4 w-4 mr-2" />
              Completed
            </Button>
          )}
        </div>
      </div>
      
      {/* Status Badge */}
      {!isNewLab && lab?.status && (
        <div className="mb-6">
          <div className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${lab.status === "draft" ? "bg-muted text-muted-foreground" : ""}
            ${lab.status === "active" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : ""}
            ${lab.status === "completed" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}
          `}>
            <FlaskConical className="h-4 w-4 mr-2" />
            {lab.status === "draft" ? "Draft" : 
             lab.status === "active" ? "Active" : "Completed"}
          </div>
        </div>
      )}
      
      {/* Tab Navigation */}
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-4">
          <TabsTrigger 
            value="circle" 
            disabled={!isNewLab && (lab?.status === "active" || lab?.status === "completed")}
          >
            1. Circle
          </TabsTrigger>
          <TabsTrigger 
            value="followers" 
            disabled={isNewLab || (!isNewLab && lab?.status !== "draft")}
          >
            2. Followers
          </TabsTrigger>
          <TabsTrigger 
            value="posts" 
            disabled={isNewLab || (!isNewLab && lab?.status !== "draft")}
          >
            3. Posts
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            disabled={isNewLab || (!isNewLab && lab?.status === "draft")}
          >
            4. Results
          </TabsTrigger>
        </TabsList>
        
        {/* Circle Tab */}
        <TabsContent value="circle">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Lab Details</CardTitle>
                  <CardDescription>
                    Define your lab's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lab Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter lab name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your lab a descriptive name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the purpose of this lab"
                            className="resize-none h-24" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Explain what you're trying to test with this lab
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="circleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circle</FormLabel>
                        <FormControl>
                          <div>
                            <input 
                              type="hidden" 
                              value={field.value} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                            <CircleFollowerManagerWrapper 
                              onCircleSelected={handleCircleSelected}
                              showCircleSelect={true}
                              selectedCircleId={selectedCircleId}
                              showFollowerManager={false}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Select or create a circle for this lab
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end">
                  <Button 
                    type="submit" 
                    disabled={isCreating || isSaving}
                  >
                    {(isCreating || isSaving) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <Save className="h-4 w-4 mr-2" />
                    {isNewLab ? "Create Lab" : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
        
        {/* Followers Tab */}
        <TabsContent value="followers">
          {!isNewLab && lab?.circleId && (
            <CircleFollowerManagerWrapper 
              selectedCircleId={lab.circleId}
              showCircleSelect={false}
              showFollowerManager={true}
            />
          )}
        </TabsContent>
        
        {/* Posts Tab */}
        <TabsContent value="posts">
          {!isNewLab && labId && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <LabPostForm labId={labId} />
              <LabPostsList labId={labId} />
            </div>
          )}
        </TabsContent>
        
        {/* Stats Tab */}
        <TabsContent value="stats">
          {!isNewLab && lab?.status !== "draft" && lab && (
            <LabStats lab={lab} />
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}