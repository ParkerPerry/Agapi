import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/posts/post-form";
import { PostCard } from "@/components/posts/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useCallback, useState } from "react";
import { createWebSocket, subscribeToWebSocket } from "@/lib/websocket";
import { CirclePanel } from "@/components/circle-panel";

export default function HomePage() {
  const { user } = useAuth();
  const [circleId, setCircleId] = useState<number | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  // Parse circle ID from URL query parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const circleParam = params.get('circle');
    if (circleParam) {
      setCircleId(parseInt(circleParam, 10));
    } else {
      setCircleId(null);
    }
  }, [window.location.search]);

  // Query for posts - either circle posts or user posts
  const { data: posts, isLoading, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: circleId ? [`/api/circles/${circleId}/posts`] : [`/api/posts/${user?.id}`],
    enabled: !!user && (circleId !== null || true),
  });

  // Query for circle details if we're in circle view
  const { data: circleDetails } = useQuery<Circle>({
    queryKey: [`/api/circles/${circleId}`],
    enabled: !!circleId && !!user,
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
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <PostForm />

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-12 w-[250px]" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))
          ) : posts?.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}