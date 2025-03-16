import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useCallback } from "react";
import { createWebSocket, subscribeToWebSocket } from "@/lib/websocket";
import { TourProvider } from "@/components/tour/tour-context";

export default function HomePage() {
  const { user } = useAuth();

  const { data: posts, isLoading, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [`/api/posts/${user?.id}`],
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

  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container py-6 main-content">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="post-form">
              <PostForm />
            </div>

            {isLoading ? (
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