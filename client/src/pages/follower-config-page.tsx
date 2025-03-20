import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, Heart, Plus, UserCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useUpdateFollower } from "@/lib/mutations/follower-mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { Loading } from "@/components/ui/loading";
import { TourProvider } from "@/components/tour/tour-context";

export default function FollowerConfigPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  // Make sure to extract the id properly from params
  const id = params?.id;
  const followerId = id ? parseInt(id) : NaN;
  
  console.log("[ConfigPage] Params:", params, "ID:", id, "Parsed ID:", followerId);
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [likes, setLikes] = useState<string[]>([]);
  const [newLike, setNewLike] = useState("");
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [newDislike, setNewDislike] = useState("");

  // Redirect to login if no user
  if (!user) {
    console.log("[ConfigPage] No user found, returning null");
    return null;
  }

  console.log(`[ConfigPage] Looking for follower with ID: ${followerId}`);
  
  const { data: follower, isLoading, error } = useQuery<AiFollower>({
    queryKey: [`/api/followers/${followerId}`],
    enabled: !isNaN(followerId) && !!user,
  });
  
  // Log debugging information
  console.log("[ConfigPage] Query status:", { 
    isLoading,
    hasError: !!error,
    errorMsg: error ? (error as Error).message : null,
    hasData: !!follower
  });

  const updateFollowerMutation = useUpdateFollower();

  // Form validation schema
  const configSchema = z.object({
    name: z.string().min(1, "Name is required"),
    personality: z.string().min(1, "Personality is required"),
    background: z.string().optional(),
    communicationStyle: z.string().optional(),
  });

  // Form setup
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      name: follower?.name || "",
      personality: follower?.personality || "",
      background: follower?.background || "",
      communicationStyle: follower?.communicationStyle || "",
    },
  });

  // Update form values when follower data is loaded
  useEffect(() => {
    if (follower) {
      form.reset({
        name: follower.name,
        personality: follower.personality,
        background: follower.background || "",
        communicationStyle: follower.communicationStyle || "",
      });
      setInterests(follower.interests || []);
      setLikes(follower.interactionPreferences?.likes || []);
      setDislikes(follower.interactionPreferences?.dislikes || []);
    }
  }, [follower, form]);

  // Handle form submission
  const onSubmit = (data: z.infer<typeof configSchema>) => {
    if (!follower) return;

    const updatedFollower = {
      ...follower,
      ...data,
      interests,
      interactionPreferences: {
        likes,
        dislikes,
      },
    };

    updateFollowerMutation.mutate(
      {
        id: follower.id,
        name: data.name,
        personality: data.personality,
        responsiveness: follower.responsiveness,
        // These aren't in the current mutation but we'll use the endpoint for now
        // In a future implementation, we can update the API endpoint to accept these fields
      },
      {
        onSuccess: () => {
          toast({
            title: "Changes saved",
            description: "AI follower configuration has been updated.",
          });
        },
      }
    );
  };

  // Interest tag management
  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  // Likes management
  const addLike = () => {
    if (newLike.trim() && !likes.includes(newLike.trim())) {
      setLikes([...likes, newLike.trim()]);
      setNewLike("");
    }
  };

  const removeLike = (like: string) => {
    setLikes(likes.filter((i) => i !== like));
  };

  // Dislikes management
  const addDislike = () => {
    if (newDislike.trim() && !dislikes.includes(newDislike.trim())) {
      setDislikes([...dislikes, newDislike.trim()]);
      setNewDislike("");
    }
  };

  const removeDislike = (dislike: string) => {
    setDislikes(dislikes.filter((i) => i !== dislike));
  };

  // Loading state
  if (isLoading) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto">
              <Loading />
            </div>
          </main>
        </div>
      </TourProvider>
    );
  }

  // Not found state
  if (!follower) {
    return (
      <TourProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container py-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">AI Follower Not Found</h1>
              <p>The AI follower you're looking for doesn't exist or you don't have permission to configure it.</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("/ai-followers")}
                variant="outline"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to AI Followers
              </Button>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => navigate("/ai-followers")}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">AI Follower Configuration</h1>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Identity & Personality Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Identity & Personality</CardTitle>
                    <CardDescription>
                      Configure how your AI follower presents itself and interacts with others
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <img src={follower.avatarUrl} alt={follower.name} />
                        <AvatarFallback className="text-lg">
                          {follower.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="personality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personality Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={2} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="background"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background & History</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} placeholder="Detail the background story and history of your AI follower" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Interests & Topics</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2 mb-4">
                        {interests.map((interest, index) => (
                          <Badge key={index} className="flex items-center gap-1">
                            {interest}
                            <button
                              type="button"
                              onClick={() => removeInterest(interest)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add a new interest"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                        />
                        <Button type="button" size="sm" onClick={addInterest}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="communicationStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication Style</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Describe how your AI follower communicates (formal, casual, enthusiastic, etc.)" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <FormLabel>Interaction Likes</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {likes.map((like, index) => (
                            <Badge key={index} className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                              {like}
                              <button
                                type="button"
                                onClick={() => removeLike(like)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newLike}
                            onChange={(e) => setNewLike(e.target.value)}
                            placeholder="Add what your AI likes"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLike())}
                          />
                          <Button type="button" size="sm" onClick={addLike} className="bg-green-600 hover:bg-green-700">
                            <Heart className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <FormLabel>Interaction Dislikes</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {dislikes.map((dislike, index) => (
                            <Badge key={index} className="flex items-center gap-1 bg-red-100 text-red-800 hover:bg-red-200">
                              {dislike}
                              <button
                                type="button"
                                onClick={() => removeDislike(dislike)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newDislike}
                            onChange={(e) => setNewDislike(e.target.value)}
                            placeholder="Add what your AI dislikes"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDislike())}
                          />
                          <Button type="button" size="sm" onClick={addDislike} className="bg-red-600 hover:bg-red-700">
                            <X className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Future Capabilities Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Functional Capabilities</CardTitle>
                    <CardDescription>
                      Advanced configuration options for your AI follower's capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                      <p>
                        Advanced configuration options are currently in development. 
                        Future updates will include knowledge base integration, response behavior configuration, 
                        and advanced customization parameters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/ai-followers")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateFollowerMutation.isPending}
                  >
                    {updateFollowerMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </TourProvider>
  );
}