import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Circle, InsertCircle, AiFollower } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Trash2, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TourProvider } from "@/components/tour/tour-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function CirclesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  if (!user) {
    return null;
  }

  const { data: circles, isLoading: isLoadingCircles } = useQuery<Circle[]>({
    queryKey: ["/api/circles"],
    enabled: !!user,
  });

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
    enabled: !!user,
  });

  const { data: selectedCircleFollowers, isLoading: isLoadingCircleFollowers } = useQuery<AiFollower[]>({
    queryKey: [`/api/circles/${selectedCircle?.id}/followers`],
    enabled: !!selectedCircle,
  });

  const form = useForm<InsertCircle>({
    defaultValues: {
      name: "",
      description: "",
      icon: "🔵",
      color: "#3b82f6",
    },
  });

  const editForm = useForm<InsertCircle>({
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      color: "",
    },
  });

  const createCircleMutation = useMutation({
    mutationFn: async (data: InsertCircle) => {
      const res = await apiRequest("POST", "/api/circles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      form.reset();
      toast({
        title: "Circle created",
        description: "Your new circle has been created successfully.",
      });
    },
  });

  const updateCircleMutation = useMutation({
    mutationFn: async (data: InsertCircle & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/circles/${data.id}`, {
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      setEditingCircle(null);
      toast({
        title: "Circle updated",
        description: "Your circle has been updated successfully.",
      });
    },
  });

  const deleteCircleMutation = useMutation({
    mutationFn: async (circleId: number) => {
      await apiRequest("DELETE", `/api/circles/${circleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({
        title: "Circle deleted",
        description: "Your circle has been deleted successfully.",
      });
    },
  });

  const addFollowerMutation = useMutation({
    mutationFn: async ({ circleId, aiFollowerId }: { circleId: number; aiFollowerId: number }) => {
      const res = await apiRequest("POST", `/api/circles/${circleId}/followers`, { aiFollowerId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${selectedCircle?.id}/followers`] });
      toast({
        title: "Follower added",
        description: "The AI follower has been added to the circle.",
      });
    },
  });

  const removeFollowerMutation = useMutation({
    mutationFn: async ({ circleId, followerId }: { circleId: number; followerId: number }) => {
      await apiRequest("DELETE", `/api/circles/${circleId}/followers/${followerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${selectedCircle?.id}/followers`] });
      toast({
        title: "Follower removed",
        description: "The AI follower has been removed from the circle.",
      });
    },
  });

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Circle</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createCircleMutation.mutate(data))} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter circle name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter emoji or icon" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the purpose of this circle"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input {...field} type="color" className="h-10 px-2" />
                          </FormControl>
                          <FormDescription>
                            Choose a color to represent this circle
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createCircleMutation.isPending}>
                      {createCircleMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Create Circle
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Circles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {circles?.map((circle) => (
                    <div
                      key={circle.id}
                      className={cn(
                        "flex flex-col space-y-4 p-4 border rounded-lg",
                        circle.isDefault && "bg-muted"
                      )}
                      style={{ borderColor: circle.color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                            style={{ backgroundColor: circle.color + "20" }}
                          >
                            {circle.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{circle.name}</h3>
                              {circle.isDefault && (
                                <Badge variant="secondary">Default</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {circle.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setSelectedCircle(circle);
                                }}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Manage AI Followers</DialogTitle>
                                <DialogDescription>
                                  Add or remove AI followers for {circle.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <ScrollArea className="h-[300px] pr-4">
                                  {isLoadingCircleFollowers ? (
                                    <div className="flex items-center justify-center">
                                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      {followers?.map((follower) => {
                                        const isInCircle = selectedCircleFollowers?.some(
                                          (f) => f.id === follower.id
                                        );
                                        return (
                                          <div
                                            key={follower.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                                          >
                                            <div className="flex items-center space-x-3">
                                              <Avatar>
                                                <img src={follower.avatarUrl} alt={follower.name} />
                                                <AvatarFallback>
                                                  {follower.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <p className="font-medium">{follower.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {follower.personality}
                                                </p>
                                              </div>
                                            </div>
                                            <Button
                                              variant={isInCircle ? "destructive" : "secondary"}
                                              size="sm"
                                              onClick={() => {
                                                if (isInCircle) {
                                                  removeFollowerMutation.mutate({
                                                    circleId: circle.id,
                                                    followerId: follower.id,
                                                  });
                                                } else {
                                                  addFollowerMutation.mutate({
                                                    circleId: circle.id,
                                                    aiFollowerId: follower.id,
                                                  });
                                                }
                                              }}
                                              disabled={
                                                addFollowerMutation.isPending ||
                                                removeFollowerMutation.isPending
                                              }
                                            >
                                              {isInCircle ? "Remove" : "Add"}
                                            </Button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {!circle.isDefault && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setEditingCircle(circle);
                                      editForm.reset({
                                        name: circle.name,
                                        description: circle.description || "",
                                        icon: circle.icon || "",
                                        color: circle.color || "",
                                      });
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Circle</DialogTitle>
                                    <DialogDescription>
                                      Update the details for {circle.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <Form {...editForm}>
                                    <form
                                      onSubmit={editForm.handleSubmit((data) => {
                                        if (editingCircle) {
                                          updateCircleMutation.mutate({
                                            id: editingCircle.id,
                                            ...data,
                                          });
                                        }
                                      })}
                                      className="space-y-4"
                                    >
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
                                        name="description"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                              <Textarea {...field} />
                                            </FormControl>
                                          </FormItem>
                                        )}
                                      />
                                      <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                          control={editForm.control}
                                          name="icon"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Icon</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <FormField
                                          control={editForm.control}
                                          name="color"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Color</FormLabel>
                                              <FormControl>
                                                <Input {...field} type="color" className="h-10 px-2" />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={updateCircleMutation.isPending}
                                      >
                                        {updateCircleMutation.isPending ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          "Update Circle"
                                        )}
                                      </Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Circle</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {circle.name}? This action
                                      cannot be undone. All posts in this circle will be moved to
                                      your default circle.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteCircleMutation.mutate(circle.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      {deleteCircleMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TourProvider>
  );
}
