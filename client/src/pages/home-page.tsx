import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { CirclePanel } from "@/components/circle-panel";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { TourProvider } from "@/components/tour/tour-context";

export default function HomePage() {
  const { user } = useAuth();

  // Get circle ID from URL query parameter
  const params = new URLSearchParams(window.location.search);
  const circleId = params.get('circle');

  // Get circle data based on ID or default
  const { data: circle, isLoading: isLoadingCircle } = useQuery<Circle>({
    queryKey: [circleId ? `/api/circles/${circleId}` : "/api/circles/default"],
    enabled: !!user,
  });

  // Get posts for the circle
  const { data: posts, isLoading: isLoadingPosts } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [`/api/circles/${circle?.id}/posts`],
    enabled: !!circle,
  });

  const isLoading = isLoadingCircle || isLoadingPosts;

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6">
          <div className="flex gap-6">
            {/* Fixed left panel */}
            <div className="w-80 shrink-0">
              {circle && <CirclePanel circleId={circle.id} />}
            </div>

            {/* Main content */}
            <div className="flex-1 space-y-6">
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