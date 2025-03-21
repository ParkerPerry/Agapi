import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AiFollower, DirectChat } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { responsivenessOptions } from "@/components/followers/follower-create-form";
import { ArrowLeft, AlertCircle, Send, Loader2, MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/utils/date";
import { useUpdateFollower } from "@/lib/mutations/follower-mutations";
import { TourProvider } from "@/components/tour/tour-context";
import { apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define types for AI follower tools
interface AITool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface AIToolset {
  equipped: AITool[];
  customInstructions: string;
}

export default function FollowerConfigPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const updateFollowerMutation = useUpdateFollower();
  
  // Direct chat state
  const [chatMessages, setChatMessages] = useState<DirectChat[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  
  // AI Tool library state
  const [toolset, setToolset] = useState<AIToolset>({
    equipped: [],
    customInstructions: ""
  });

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

  // IMPORTANT: Fetch the follower data first before any hooks that depend on it
  const apiUrl = `/api/followers/${id}`;
  console.log(`[ConfigPage] API Request URL: ${apiUrl}`);
  console.log(`[ConfigPage] Query enabled:`, !!user && !!id && !isNaN(id));
  
  const { data: follower, isLoading, error } = useQuery<AiFollower>({
    queryKey: [apiUrl],
    enabled: !!user && !!id && !isNaN(id),
    retry: (failureCount, error) => {
      console.error(`[ConfigPage] API Error (attempt ${failureCount}):`, error);
      return failureCount < 2; // Only retry twice
    },
    select: (data) => {
      console.log(`[ConfigPage] API Success:`, data);
      return data;
    }
  });
  
  // Fetch available tools
  const { data: availableTools, isLoading: isLoadingTools } = useQuery({
    queryKey: ['/api/tools'],
    queryFn: async () => {
      const response = await fetch('/api/tools', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available tools');
      }
      
      return response.json() as Promise<AITool[]>;
    }
  });
  
  console.log("[ConfigPage] Looking for follower with ID:", id);
  console.log("[ConfigPage] Query status:", queryStatus);

  // Handle initializing tools when available
  useEffect(() => {
    if (availableTools && availableTools.length > 0) {
      setToolset(prev => ({
        ...prev,
        equipped: availableTools
      }));
    }
  }, [availableTools]);
  
  // Update query status
  useEffect(() => {
    setQueryStatus({
      isLoading,
      hasError: !!error,
      errorMsg: error ? (error as Error).message : null,
      hasData: !!follower,
    });
  }, [isLoading, error, follower]);
  
  // Fetch chat history when follower is loaded
  useEffect(() => {
    if (follower && id) {
      fetchChatHistory();
    }
  }, [follower, id]);

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
      
      // Set tools if they exist in the follower data
      if (follower.tools) {
        setToolset(follower.tools);
      }
    }
  }, [follower]);
  
  // Helper function to equip or unequip a specific tool
  const toggleToolEquipped = (toolId: string, enabled: boolean) => {
    setToolset(prevToolset => ({
      ...prevToolset,
      equipped: prevToolset.equipped.map(tool => 
        tool.id === toolId ? { ...tool, enabled } : tool
      )
    }));
  };
  
  // Fetch chat history when follower data is loaded
  const fetchChatHistory = async () => {
    if (!id || !user) return;
    
    try {
      const response = await fetch(`/api/direct-chat/${id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const history = await response.json();
        setChatMessages(history);
        
        // Scroll to bottom after history loads
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };
  
  // Send a message to the AI follower
  const sendMessage = async () => {
    if (!messageInput.trim() || !id || !user || isSendingMessage) return;
    
    try {
      setIsSendingMessage(true);
      
      const response = await fetch(`/api/direct-chat/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageInput }),
        credentials: 'include',
      });
      
      if (response.ok) {
        const messages = await response.json();
        // Add both user message and AI response to chat
        setChatMessages(prev => [...prev, ...messages]);
        setMessageInput("");
        
        // Scroll to bottom after sending
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

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
      
      // Add AI tools
      updateData.tools = toolset;
    }
    
    updateFollowerMutation.mutate(updateData, {
      onSuccess: () => {
        toast({
          title: "Tools Configured",
          description: "AI follower tools have been updated",
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

            {/* Configuration Tabs and Cards */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>AI Follower Configuration</CardTitle>
                    <CardDescription>Customize your AI follower's settings and chat directly</CardDescription>
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
                <Tabs defaultValue="identity" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="identity">Identity</TabsTrigger>
                    <TabsTrigger value="personality">Personality</TabsTrigger>
                    <TabsTrigger value="tools">Tools</TabsTrigger>
                  </TabsList>
                  
                  {/* Identity Tab */}
                  <TabsContent value="identity" className="space-y-6">
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
                  </TabsContent>
                  
                  {/* Personality Tab */}
                  <TabsContent value="personality" className="space-y-6">
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
                  </TabsContent>
                  
                  {/* Tools Tab */}
                  <TabsContent value="tools" className="space-y-6">
                    {isLoadingTools ? (
                      <div className="flex justify-center items-center py-4">
                        <p className="text-muted-foreground">Loading available tools...</p>
                      </div>
                    ) : toolset.equipped && toolset.equipped.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Enable tools to give your AI follower special capabilities
                        </p>
                        
                        {toolset.equipped.map(tool => (
                          <div key={tool.id} className="flex items-start justify-between gap-4 border rounded-lg p-4 bg-card">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{tool.name}</h3>
                                <Badge variant={tool.enabled ? "default" : "outline"}>
                                  {tool.enabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`tool-${tool.id}`} className="text-sm">
                                {tool.enabled ? "Enabled" : "Disabled"}
                              </Label>
                              <Switch 
                                id={`tool-${tool.id}`}
                                checked={tool.enabled}
                                onCheckedChange={(checked) => toggleToolEquipped(tool.id, checked)}
                                disabled={isDefaultTom}
                              />
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-6">
                          <Label htmlFor="customInstructions">Custom Tool Instructions</Label>
                          <Textarea
                            id="customInstructions"
                            value={toolset.customInstructions || ""}
                            onChange={(e) => setToolset(prev => ({...prev, customInstructions: e.target.value}))}
                            placeholder="Add custom instructions for tool usage (optional)"
                            rows={3}
                            disabled={isDefaultTom}
                            className="mt-2 resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Custom instructions to provide additional context for your AI follower on when and how to use tools
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="font-semibold">No Tools Available</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          There are currently no tools available for your AI follower to use.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Direct Chat Container */}
            <Card>
              <CardHeader>
                <CardTitle>Chat with {name || "AI Follower"}</CardTitle>
                <CardDescription>Send direct messages to your AI follower and get immediate responses</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Chat Messages Container */}
                <div 
                  className="h-80 overflow-y-auto border rounded-md p-4 mb-4"
                  ref={chatContainerRef}
                >
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p>No messages yet. Start a conversation with your AI follower!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={index} 
                          className={`flex ${msg.isUserMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.isUserMessage 
                                ? 'bg-primary text-primary-foreground ml-auto' 
                                : 'bg-muted'
                            }`}
                          >
                            {!msg.isUserMessage && (
                              <div className="flex items-center space-x-2 mb-1">
                                <Avatar className="h-6 w-6">
                                  <img src={avatarUrl} alt={name} />
                                  <AvatarFallback className="text-xs">
                                    {name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{name}</span>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className="text-xs opacity-70 mt-1 text-right">
                              {formatRelativeTime(msg.createdAt ? new Date(msg.createdAt) : new Date())}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="flex space-x-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={isSendingMessage}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isSendingMessage || !messageInput.trim()}
                  >
                    {isSendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="sr-only">Send</span>
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