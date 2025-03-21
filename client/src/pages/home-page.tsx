import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { CirclePanel } from "@/components/circle-panel";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useCallback, useState } from "react";
import { createWebSocket, subscribeToWebSocket } from "@/lib/websocket";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [circlePanelCollapsed, setCirclePanelCollapsed] = useState(isMobile);
  
  // Extract circleId from URL query parameter if present
  const searchParams = new URLSearchParams(window.location.search);
  const circleId = searchParams.get('circle') ? parseInt(searchParams.get('circle')!) : undefined;
  
  // Query for circle details if a circleId is provided
  const { data: circleData } = useQuery<Circle>({
    queryKey: ["/api/circles", circleId],
    enabled: !!circleId && !!user,
  });
  
  // Determine which endpoint to query based on whether we're viewing a specific circle
  const postsEndpoint = circleId ? `/api/circles/${circleId}/posts` : `/api/posts/${user?.id}`;

  const { data: posts, isLoading, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [postsEndpoint],
    enabled: !!user,
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

  // Set panel collapsed state based on mobile detection
  useEffect(() => {
    setCirclePanelCollapsed(isMobile);
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {circleId && (
          <CirclePanel 
            circleId={circleId} 
            isCollapsed={circlePanelCollapsed} 
            onCollapse={setCirclePanelCollapsed}
          />
        )}
        <div className={cn(
          "flex-1 overflow-y-auto p-6",
          circleId && !circlePanelCollapsed ? "ml-80" : "",
          circleId && circlePanelCollapsed ? "ml-16" : ""
        )}>
          <div className="max-w-2xl mx-auto space-y-6">
            {circleData && (
              <div className="p-4 border rounded-lg mb-4" style={{ borderColor: typeof circleData.color === 'string' ? circleData.color : '#e2e8f0' }}>
                <h1 className="text-2xl font-bold flex items-center">
                  <span className="mr-2">{circleData.icon}</span>
                  {circleData.name}
                </h1>
                <p className="text-muted-foreground">{circleData.description}</p>
              </div>
            )}
            
            <PostForm defaultCircleId={circleId} />

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
        </div>
      </main>
    </div>
  );
}