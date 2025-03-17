import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useCallback } from "react";
import { createWebSocket, subscribeToWebSocket } from "@/lib/websocket";
import { TourProvider } from "@/components/tour/tour-context";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  const { data: posts, isLoading: isLoadingPosts, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [`/api/circles/${circle?.id}/posts`],
    enabled: !!circle,
  });

  // Handle real-time updates
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'thread-update' || data.type === 'post-update') {
      refetch();
    }
  }, [refetch]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      const ws = createWebSocket();
      const unsubscribe = subscribeToWebSocket('*', handleWebSocketMessage);

      return () => {
        unsubscribe();
        if (ws) {
          ws.close();
        }
      };
    }
  }, [user, handleWebSocketMessage]);

  const isLoading = isLoadingCircle || isLoadingPosts;

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6 main-content">
          <div className="max-w-2xl mx-auto space-y-6">
            {isLoadingCircle ? (
              <Skeleton className="h-24 w-full" />
            ) : circle && (
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-full text-lg"
                      style={{ backgroundColor: circle.color + "20" }}
                    >
                      {circle.icon}
                    </div>
                    <CardTitle>{circle.name}</CardTitle>
                  </div>
                  {circle.description && (
                    <CardDescription>{circle.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            )}

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
        </main>
      </div>
    </TourProvider>
  );
}