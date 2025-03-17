import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle, User, CircleMember, AiFollower } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { TourProvider } from "@/components/tour/tour-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircleOwner, CircleMembers, CircleFollowers } from "@/components/circle-details";

type CircleDetailsData = {
  circle: Circle;
  owner: User;
  members: (CircleMember & { user: User | null })[];
  followers: AiFollower[];
};

export default function HomePage() {
  const { user } = useAuth();

  // Get circle ID from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const circleId = params.get('circle');

  // Get circle details
  const { data: circleDetails, isLoading: isLoadingCircleDetails } = useQuery<CircleDetailsData>({
    queryKey: [`/api/circles/${circleId}/details`],
    enabled: !!circleId && !!user,
  });

  // Get circle data based on ID or default
  const { data: circle, isLoading: isLoadingCircle } = useQuery<Circle>({
    queryKey: [circleId ? `/api/circles/${circleId}` : "/api/circles/default"],
    enabled: !!user,
  });

  // Get posts for the circle
  const { data: posts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: [`/api/circles/${circle?.id}/posts`],
    enabled: !!circle,
  });

  const isLoading = isLoadingCircle || isLoadingPosts || isLoadingCircleDetails;

  if (!user) {
    return null;
  }

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex gap-6">
            {circleDetails && (
              <div className="w-80 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-2xl"
                        style={{ backgroundColor: circleDetails.circle.color + "20" }}
                      >
                        {circleDetails.circle.icon}
                      </div>
                      <div>
                        <CardTitle>{circleDetails.circle.name}</CardTitle>
                        <CardDescription>
                          {circleDetails.circle.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CircleOwner owner={circleDetails.owner} />
                    <CircleMembers members={circleDetails.members} />
                    <CircleFollowers followers={circleDetails.followers} />
                  </CardContent>
                </Card>
              </div>
            )}

            <div className={circleDetails ? "flex-1 space-y-6" : "max-w-2xl mx-auto space-y-6"}>
              <div className="post-form">
                <PostForm defaultCircleId={circle?.id} />
              </div>

              {isLoadingPosts ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-12 w-[250px]" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))
              ) : posts?.map((post) => (
                <div key={post.id} className="post-card">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </TourProvider>
  );
}