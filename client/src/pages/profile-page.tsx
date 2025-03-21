import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AiFollower, User } from "@shared/schema";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { FollowerCreateForm } from "@/components/followers/follower-create-form";
import { FollowerCard } from "@/components/followers/follower-card";
import { useUpdateFollower, useDeleteFollower } from "@/lib/mutations/follower-mutations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, Mail, MapPin, MessageSquare } from "lucide-react";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const userId = params.userId ? parseInt(params.userId) : currentUser?.id;
  const [editingFollower, setEditingFollower] = useState<AiFollower | null>(null);
  
  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  // Redirect to home if no valid user ID
  if (!userId) {
    return null;
  }

  // Fetch profile user data if not the current user
  const { data: profileUser } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId && !isOwnProfile,
  });

  // Determine which user object to display
  const displayUser = isOwnProfile ? currentUser : profileUser;

  const { data: followers, isLoading: followersLoading } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers", userId],
    enabled: !!userId,
  });

  const updateFollowerMutation = useUpdateFollower();
  const deleteFollowerMutation = useDeleteFollower();

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6 text-center">
          <Card>
            <CardContent className="pt-6">
              <p>Loading profile...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 md:h-32 md:w-32">
                  <AvatarImage src={displayUser.avatarUrl || ''} />
                  <AvatarFallback className="text-3xl">
                    {displayUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-bold">{displayUser.username}</h2>
                    {displayUser.bio && (
                      <p className="text-muted-foreground mt-1">{displayUser.bio}</p>
                    )}
                    {!displayUser.bio && isOwnProfile && (
                      <p className="text-muted-foreground mt-1 italic">
                        No bio yet. Add one in your account settings.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarDays className="mr-1 h-4 w-4" />
                      <span>Joined {displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : "recently"}</span>
                    </div>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="pt-2">
                      <Link href="/account">
                        <Button variant="outline">Edit Profile</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Only show follower creation form on own profile */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Create AI Follower</CardTitle>
                <CardDescription>
                  Create your own AI companions that will interact with your posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FollowerCreateForm />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>AI Followers</CardTitle>
              <CardDescription>
                {isOwnProfile 
                  ? "Manage your AI followers and their behaviors" 
                  : `${displayUser.username}'s AI followers`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {followersLoading ? (
                <p className="text-center py-4 text-muted-foreground">Loading followers...</p>
              ) : followers && followers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {followers.map((follower) => (
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
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {isOwnProfile 
                    ? "You haven't created any AI followers yet." 
                    : `${displayUser.username} hasn't created any AI followers yet.`}
                </div>
              )}
            </CardContent>
            {isOwnProfile && followers && followers.length === 0 && (
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                  Create your first AI follower above to get started!
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}