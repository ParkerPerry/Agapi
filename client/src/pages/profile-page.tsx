import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, React } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = parseInt(params.userId || user?.id?.toString() || "0");
  const [editingFollower, setEditingFollower] = useState<AiFollower | null>(null);

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
    enabled: !!userId,
  });

  function generateUniqueAvatarUrl() {
    const randomSeed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
  }

  const form = useForm({
    defaultValues: {
      name: "",
      personality: "",
      avatarUrl: generateUniqueAvatarUrl(),
      responsiveness: "active",
    },
  });

  const editForm = useForm({
    defaultValues: {
      name: "",
      personality: "",
      responsiveness: "active",
    },
  });

  // Reset edit form when follower changes
  React.useEffect(() => {
    if (editingFollower) {
      editForm.reset({
        name: editingFollower.name,
        personality: editingFollower.personality,
        responsiveness: editingFollower.responsiveness,
      });
    }
  }, [editingFollower]);

  const createFollowerMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      personality: string; 
      avatarUrl: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
    }) => {
      const res = await apiRequest("POST", "/api/followers", {
        ...data,
        avatarUrl: generateUniqueAvatarUrl(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      form.reset({
        name: "",
        personality: "",
        avatarUrl: generateUniqueAvatarUrl(),
        responsiveness: "active",
      });
    },
  });

  const updateFollowerMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      name: string;
      personality: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
    }) => {
      const res = await apiRequest("PATCH", `/api/followers/${data.id}`, {
        name: data.name,
        personality: data.personality,
        responsiveness: data.responsiveness,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      setEditingFollower(null);
    },
  });

  const deleteFollowerMutation = useMutation({
    mutationFn: async (followerId: number) => {
      await apiRequest("DELETE", `/api/followers/${followerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
    },
  });

  const responsivenessOptions = [
    { value: "instant", label: "Instant (< 5 min)", description: "Quick to respond, always online" },
    { value: "active", label: "Active (5-60 min)", description: "Regular social media user" },
    { value: "casual", label: "Casual (1-8 hrs)", description: "Checks occasionally" },
    { value: "zen", label: "Zen (8-24 hrs)", description: "Mindful and deliberate responses" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create AI Follower</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createFollowerMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter follower name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personality</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the follower's personality (e.g., 'Enthusiastic tech nerd who loves blockchain')"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsiveness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsiveness</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select responsiveness level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {responsivenessOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div>
                                  <div>{option.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Determines how quickly and often the AI follower responds to posts
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createFollowerMutation.isPending}>
                    {createFollowerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create Follower
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {followers?.map((follower) => (
                  <div key={follower.id} className="flex flex-col space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <img src={follower.avatarUrl} alt={follower.name} />
                          <AvatarFallback>
                            {follower.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{follower.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {follower.personality}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {responsivenessOptions.find(opt => opt.value === follower.responsiveness)?.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingFollower(follower)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit AI Follower</DialogTitle>
                              <DialogDescription>
                                Update the profile details for {follower.name}
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...editForm}>
                              <form onSubmit={editForm.handleSubmit((data) => {
                                if (editingFollower) {
                                  updateFollowerMutation.mutate({
                                    id: editingFollower.id,
                                    ...data,
                                  });
                                }
                              })} className="space-y-4">
                                <FormField
                                  control={editForm.control}
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
                                  control={editForm.control}
                                  name="personality"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Personality</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={editForm.control}
                                  name="responsiveness"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Responsiveness</FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {responsivenessOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                              <div>
                                                <div>{option.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {option.description}
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full"
                                  disabled={updateFollowerMutation.isPending}
                                >
                                  {updateFollowerMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    "Update Follower"
                                  )}
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete AI Follower</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {follower.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFollowerMutation.mutate(follower.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {deleteFollowerMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {follower.background && (
                      <div className="space-y-2 mt-2">
                        <p className="text-sm">{follower.background}</p>

                        {follower.interests && follower.interests.length > 0 && (
                          <div>
                            <p className="text-sm font-medium">Interests:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {follower.interests.map((interest, i) => (
                                <span
                                  key={i}
                                  className="text-xs bg-secondary px-2 py-1 rounded-full"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {follower.communicationStyle && (
                          <p className="text-sm">
                            <span className="font-medium">Communication style: </span>
                            {follower.communicationStyle}
                          </p>
                        )}

                        {follower.interactionPreferences && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Interaction Preferences:</p>
                            <div className="space-y-1 pl-2">
                              <p className="text-sm">
                                <span className="text-green-600">Likes:</span>{" "}
                                {follower.interactionPreferences.likes.join(", ")}
                              </p>
                              <p className="text-sm">
                                <span className="text-red-600">Dislikes:</span>{" "}
                                {follower.interactionPreferences.dislikes.join(", ")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}