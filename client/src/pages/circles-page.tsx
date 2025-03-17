import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Circle, InsertCircle, AiFollower, CircleInvitation } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Pencil, Share2, Users, Trash2 } from "lucide-react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TourProvider } from "@/components/tour/tour-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type CircleGroups = {
  owned: Circle[];
  shared: Circle[];
  invited: Circle[];
};

export default function CirclesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCircle, setEditingCircle] = useState<Circle | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [, navigate] = useLocation();
  const [inviteeUsername, setInviteeUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<"viewer" | "collaborator">("viewer");
  const [selectedInvitation, setSelectedInvitation] = useState<CircleInvitation | null>(null);

  if (!user) {
    return null;
  }

  const { data: circles, isLoading: isLoadingCircles } = useQuery<CircleGroups>({
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

  const { data: invitations } = useQuery<CircleInvitation[]>({
    queryKey: ["/api/circles/invitations/pending"],
    enabled: !!user,
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
      icon: "🔵",
      color: "#3b82f6",
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
      setShowEmojiPicker(false);
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
      setShowEditEmojiPicker(false);
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

  const createInvitationMutation = useMutation({
    mutationFn: async ({ circleId, username, role }: { circleId: number; username: string; role: "viewer" | "collaborator" }) => {
      const res = await apiRequest("POST", `/api/circles/${circleId}/invitations`, { username, role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles/invitations"] });
      toast({
        title: "Invitation sent",
        description: "The user will be notified of your invitation.",
      });
      setInviteeUsername("");
    },
    onError: (error: any) => {
      toast({
        title: "Error sending invitation",
        description: error.message || "Could not send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: number; status: "accepted" | "declined" }) => {
      const res = await apiRequest("PATCH", `/api/circles/invitations/${invitationId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles/invitations/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/circles"] });
      toast({
        title: "Invitation response sent",
        description: "Your response has been recorded.",
      });
    },
  });

  const renderCircleSection = (title: string, circleList: Circle[] = [], showShareButton = true) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {circleList.map((circle) => (
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
                      <Badge
                        variant={circle.visibility === "shared" ? "default" : "outline"}
                      >
                        {circle.visibility}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {circle.description}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    onClick={() => navigate(`/?circle=${circle.id}`)}
                  >
                    Enter Circle
                  </Button>

                  {showShareButton && !circle.isDefault && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Share Circle</SheetTitle>
                          <SheetDescription>
                            Invite others to join {circle.name}
                          </SheetDescription>
                        </SheetHeader>
                        <div className="py-4">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              createInvitationMutation.mutate({
                                circleId: circle.id,
                                username: inviteeUsername,
                                role: selectedRole,
                              });
                            }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="username">Username</Label>
                              <Input
                                id="username"
                                value={inviteeUsername}
                                onChange={(e) => setInviteeUsername(e.target.value)}
                                placeholder="Enter username to invite"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Permission Level</Label>
                              <RadioGroup
                                value={selectedRole}
                                onValueChange={(value) =>
                                  setSelectedRole(value as "viewer" | "collaborator")
                                }
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="viewer" id="viewer" />
                                  <Label htmlFor="viewer">Viewer</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="collaborator"
                                    id="collaborator"
                                  />
                                  <Label htmlFor="collaborator">Collaborator</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            <Button
                              type="submit"
                              disabled={createInvitationMutation.isPending}
                              className="w-full"
                            >
                              {createInvitationMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                "Send Invitation"
                              )}
                            </Button>
                          </form>
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}

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
                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full text-left font-normal"
                                            onClick={() => setShowEditEmojiPicker(true)}
                                          >
                                            {field.value || "Select an emoji"}
                                          </Button>
                                          <Dialog
                                            open={showEditEmojiPicker}
                                            onOpenChange={setShowEditEmojiPicker}
                                          >
                                            <DialogContent className="p-0">
                                              <EmojiPicker
                                                theme={Theme.AUTO}
                                                onEmojiClick={(emoji) => {
                                                  field.onChange(emoji.emoji);
                                                  setShowEditEmojiPicker(false);
                                                }}
                                                width="100%"
                                              />
                                            </DialogContent>
                                          </Dialog>
                                        </div>
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
  );

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {invitations && invitations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Circle Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Circle Invitation</p>
                          <p className="text-sm text-muted-foreground">
                            You've been invited as a {invitation.role}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            onClick={() =>
                              respondToInvitationMutation.mutate({
                                invitationId: invitation.id,
                                status: "accepted",
                              })
                            }
                            disabled={respondToInvitationMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              respondToInvitationMutation.mutate({
                                invitationId: invitation.id,
                                status: "declined",
                              })
                            }
                            disabled={respondToInvitationMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full text-left font-normal"
                                  onClick={() => setShowEmojiPicker(true)}
                                >
                                  {field.value || "🔵"}
                                </Button>
                                <Dialog open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                  <DialogContent className="p-0">
                                    <EmojiPicker
                                      theme={Theme.AUTO}
                                      onEmojiClick={(emoji) => {
                                        field.onChange(emoji.emoji);
                                        setShowEmojiPicker(false);
                                      }}
                                      width="100%"
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
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
                              value={field.value || ""}
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
                            <Input {...field} value={field.value || "#3b82f6"} type="color" className="h-10 px-2" />
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

            {circles?.owned && renderCircleSection("Your Circles", circles.owned)}
            {circles?.shared && renderCircleSection("Shared With You", circles.shared, false)}
            {circles?.invited && renderCircleSection("Invitations", circles.invited, false)}

          </div>
        </main>
      </div>
    </TourProvider>
  );
}