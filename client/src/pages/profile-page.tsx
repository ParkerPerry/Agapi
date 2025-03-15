import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = parseInt(params.userId || user?.id?.toString() || "0");

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
    },
  });

  const createFollowerMutation = useMutation({
    mutationFn: async (data: { name: string; personality: string; avatarUrl: string }) => {
      const res = await apiRequest("POST", "/api/followers", {
        ...data,
        avatarUrl: generateUniqueAvatarUrl(), // Generate new URL on submit
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      form.reset({
        name: "",
        personality: "",
        avatarUrl: generateUniqueAvatarUrl(), // Generate new URL for next form
      });
    },
  });

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
                  <div key={follower.id} className="flex items-center space-x-4 p-4 border rounded-lg">
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
                    </div>
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