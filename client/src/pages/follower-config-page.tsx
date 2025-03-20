import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { responsivenessOptions } from "@/components/followers/follower-create-form";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useUpdateFollower } from "@/lib/mutations/follower-mutations";
import { TourProvider } from "@/components/tour/tour-context";

export default function FollowerConfigPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const updateFollowerMutation = useUpdateFollower();

  // Default to empty string values for form fields
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [responsiveness, setResponsiveness] = useState<"instant" | "active" | "casual" | "zen">("active");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [background, setBackground] = useState("");
  const [interactionLikes, setInteractionLikes] = useState("");
  const [interactionDislikes, setInteractionDislikes] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [interests, setInterests] = useState("");

  // Extract follower ID from URL with enhanced logging
  console.log("[ConfigPage] URL Parameters from useParams:", params);
  console.log("[ConfigPage] Current location pathname:", window.location.pathname);
  
  // Attempt to extract ID from URL directly as fallback
  const pathParts = window.location.pathname.split('/');
  const pathId = pathParts[pathParts.length - 1];
  console.log("[ConfigPage] Path parts:", pathParts);
  console.log("[ConfigPage] Last path segment:", pathId);
  
  // Use params.id if available, otherwise try extracting from pathname directly
  const extractedId = params.id || pathId;
  console.log("[ConfigPage] Extracted ID:", extractedId);
  
  // Parse the ID to number 
  const id = extractedId && !isNaN(parseInt(extractedId)) ? parseInt(extractedId) : null;
  console.log("[ConfigPage] Parsed ID as number:", id);
  console.log("[ConfigPage] User:", user?.id, user?.username);

  // Query status tracking
  const [queryStatus, setQueryStatus] = useState<{
    isLoading: boolean;
    hasError: boolean;
    errorMsg: string | null;
    hasData: boolean;
  }>({
    isLoading: true,
    hasError: false,
    errorMsg: null,
    hasData: false,
  });

  // Fetch the follower data
  const apiUrl = `/api/followers/${id}`;
  console.log(`[ConfigPage] API Request URL: ${apiUrl}`);
  console.log(`[ConfigPage] Query enabled:`, !!user && !!id && !isNaN(id));
  
  const { data: follower, isLoading, error } = useQuery<AiFollower>({
    queryKey: [apiUrl],
    enabled: !!user && !!id && !isNaN(id),
    // Using retry callback for error handling
    retry: (failureCount, error) => {
      console.error(`[ConfigPage] API Error (attempt ${failureCount}):`, error);
      return failureCount < 2; // Only retry twice
    },
    // Using callbacks for data and status tracking
    select: (data) => {
      console.log(`[ConfigPage] API Success:`, data);
      return data;
    }
  });

  console.log("[ConfigPage] Looking for follower with ID:", id);
  console.log("[ConfigPage] Query status:", queryStatus);

  // Update query status
  useEffect(() => {
    setQueryStatus({
      isLoading,
      hasError: !!error,
      errorMsg: error ? (error as Error).message : null,
      hasData: !!follower,
    });
  }, [isLoading, error, follower]);

  // Populate form when data is loaded
  useEffect(() => {
    if (follower) {
      setName(follower.name || "");
      setPersonality(follower.personality || "");
      // Ensure the value is one of the allowed responsiveness values
      const validResponsiveness = ["instant", "active", "casual", "zen"].includes(follower.responsiveness) 
        ? follower.responsiveness as "instant" | "active" | "casual" | "zen" 
        : "active";
      setResponsiveness(validResponsiveness);
      setAvatarUrl(follower.avatarUrl || "");
      setBackground(follower.background || "");
      setCommunicationStyle(follower.communicationStyle || "");
      setInterests(follower.interests ? follower.interests.join(", ") : "");
      
      if (follower.interactionPreferences) {
        setInteractionLikes(follower.interactionPreferences.likes.join(", "));
        setInteractionDislikes(follower.interactionPreferences.dislikes.join(", "));
      }
    }
  }, [follower]);

  // Check if this is the default Tom follower (ID 1 or name includes "Tom")
  const isDefaultTom = follower?.id === 1 || (follower?.name && follower.name.toLowerCase().includes('tom'));
  console.log("[ConfigPage] Is default Tom?", isDefaultTom);
  
  // Save all settings
  const saveBasicSettings = () => {
    if (!id) return;
    
    // Create an object with the basic settings
    const updateData: any = {
      id,
      name,
      personality,
      responsiveness,
    };
    
    // Add advanced settings if not the default Tom follower
    if (!isDefaultTom) {
      updateData.background = background;
      updateData.communicationStyle = communicationStyle;
      
      // Parse comma-separated interests into an array
      if (interests) {
        updateData.interests = interests.split(',').map(item => item.trim()).filter(Boolean);
      }
      
      // Parse likes and dislikes
      updateData.interactionPreferences = {
        likes: interactionLikes.split(',').map(item => item.trim()).filter(Boolean),
        dislikes: interactionDislikes.split(',').map(item => item.trim()).filter(Boolean)
      };
    }
    
    updateFollowerMutation.mutate(updateData, {
      onSuccess: () => {
        toast({
          title: "Settings Saved",
          description: "Basic AI follower settings have been updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to save settings: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  // Redirect to login if no user
  if (!user) {
    return null;
  }

  // Show loading state
  if (queryStatus.isLoading) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/ai-followers")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">Loading AI Follower Configuration...</h1>
              </div>
            </div>
          </main>
        </div>
      </TourProvider>
    );
  }

  // Show error state
  if (queryStatus.hasError || (!queryStatus.hasData && !queryStatus.isLoading)) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/ai-followers")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">AI Follower Not Found</h1>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-semibold">Error Loading Follower Configuration</h2>
                    <p className="text-muted-foreground mt-2">
                      {queryStatus.errorMsg || "Could not find the requested AI follower. It may have been deleted or you don't have permission to access it."}
                    </p>
                    <Button className="mt-4" onClick={() => navigate("/ai-followers")}>
                      Return to Followers
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
          <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ai-followers")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">AI Follower Configuration</h1>
          </div>

          {/* Upper Container - Identity & Personality */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Identity & Personality</CardTitle>
                  <CardDescription>Configure how your AI follower appears and behaves</CardDescription>
                </div>
                <Button 
                  onClick={saveBasicSettings}
                  disabled={updateFollowerMutation.isPending}
                >
                  {updateFollowerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile section */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-3">
                  <Avatar className="h-24 w-24">
                    <img src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-2xl">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Avatar URL</p>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name your AI follower" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality</Label>
                    <Input 
                      id="personality" 
                      value={personality} 
                      onChange={(e) => setPersonality(e.target.value)}
                      placeholder="Describe your AI follower's personality" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="responsiveness">Responsiveness</Label>
                    <Select 
                      value={responsiveness}
                      onValueChange={(value) => {
                        // Cast the string value to the specific union type
                        setResponsiveness(value as "instant" | "active" | "casual" | "zen");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select responsiveness level" />
                      </SelectTrigger>
                      <SelectContent>
                        {responsivenessOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Background section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="background">Background Story</Label>
                  <Textarea 
                    id="background" 
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="Create a background story for your AI follower" 
                    rows={4}
                    disabled={isDefaultTom}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {isDefaultTom 
                      ? "Background stories are generated automatically and cannot be edited for the default Tom follower."
                      : "Enter a background story for your AI follower. This helps create a more realistic persona."}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Textarea 
                    id="interests" 
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="List interests separated by commas" 
                    rows={2}
                    disabled={isDefaultTom}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {isDefaultTom 
                      ? "Interests are generated from your follower's personality and cannot be edited for the default Tom follower."
                      : "Enter interests separated by commas (e.g., blockchain, AI, robotics, gaming)"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="communicationStyle">Communication Style</Label>
                  <Textarea 
                    id="communicationStyle" 
                    value={communicationStyle}
                    onChange={(e) => setCommunicationStyle(e.target.value)}
                    placeholder="Describe how your AI follower communicates" 
                    rows={2}
                    disabled={isDefaultTom}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {isDefaultTom 
                      ? "Communication style is derived from personality and cannot be edited for the default Tom follower."
                      : "Describe how your AI follower communicates (e.g., formal, casual, technical, humorous)"}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="likes">Likes</Label>
                    <Textarea 
                      id="likes" 
                      value={interactionLikes}
                      onChange={(e) => setInteractionLikes(e.target.value)}
                      placeholder="What this AI follower likes (comma separated)" 
                      rows={2}
                      disabled={isDefaultTom}
                      className="resize-none"
                    />
                    {!isDefaultTom && (
                      <p className="text-xs text-muted-foreground">
                        Separate multiple likes with commas
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dislikes">Dislikes</Label>
                    <Textarea 
                      id="dislikes" 
                      value={interactionDislikes}
                      onChange={(e) => setInteractionDislikes(e.target.value)}
                      placeholder="What this AI follower dislikes (comma separated)" 
                      rows={2}
                      disabled={isDefaultTom}
                      className="resize-none"
                    />
                    {!isDefaultTom && (
                      <p className="text-xs text-muted-foreground">
                        Separate multiple dislikes with commas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lower Container - Functional Capabilities (future implementation) */}
          <Card>
            <CardHeader>
              <CardTitle>Functional Capabilities</CardTitle>
              <CardDescription>
                Configure how your AI follower interacts with content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-medium">Advanced Configuration Coming Soon</h3>
                  <p className="text-muted-foreground">
                    In the future, you'll be able to customize knowledge bases, response behaviors, 
                    and advanced parameters for your AI follower in this section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </TourProvider>
  );
}