import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AiFollower } from "@shared/schema";
import { useParams } from "wouter";
import { useState } from "react";
import { FollowerCreateForm } from "@/components/followers/follower-create-form";
import { FollowerCard } from "@/components/followers/follower-card";
import { useUpdateFollower, useDeleteFollower } from "@/lib/mutations/follower-mutations";

export default function ProfilePage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params.userId ? parseInt(params.userId) : user?.id;
  const [editingFollower, setEditingFollower] = useState<AiFollower | null>(null);

  // Redirect to home if no valid user ID
  if (!userId) {
    return null;
  }

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
    enabled: !!userId,
  });

  const updateFollowerMutation = useUpdateFollower();
  const deleteFollowerMutation = useDeleteFollower();

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
              <FollowerCreateForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {followers?.map((follower) => (
                  <FollowerCard
                    key={follower.id}
                    follower={follower}
                    onEdit={(updatedFollower) => {
                      updateFollowerMutation.mutate({
                        id: updatedFollower.id,
                        name: updatedFollower.name,
                        personality: updatedFollower.personality,
                        responsiveness: updatedFollower.responsiveness,
                      });
                    }}
                    onToggleActive={(followerId) => {
                      deleteFollowerMutation.mutate(followerId);
                    }}
                    isUpdating={deleteFollowerMutation.isPending}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}