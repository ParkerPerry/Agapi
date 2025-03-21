import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm, PostCard } from "@/components/posts";
import { CirclePanel } from "@/components/circle-panel";
import { useQuery } from "@tanstack/react-query";
import { Post, Circle } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useCallback, useState } from "react";
import { createWebSocket, subscribeToWebSocket } from "@/lib/websocket";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PostWithInteractions } from "@/components/posts/post-types";

export default function HomePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [circlePanelCollapsed, setCirclePanelCollapsed] = useState(isMobile);
  
  // Extract circleId from URL query parameter if present
  const searchParams = new URLSearchParams(window.location.search);
  const circleIdFromUrl = searchParams.get('circle') ? parseInt(searchParams.get('circle')!) : undefined;
  
  // Query to get user's default circle if no specific circle is selected
  const { data: defaultCircleData, isLoading: isLoadingDefaultCircle } = useQuery<Circle>({
    queryKey: ["/api/default-circle"],
    enabled: !!user,
    // Don't update query cache when url circleId is present, to prevent cache conflicts
    staleTime: circleIdFromUrl ? Infinity : 0,
  });
  
  // Use the URL circle ID or default to the user's default circle ID
  const circleId = circleIdFromUrl || defaultCircleData?.id;
  
  // Query for circle details if a circleId is provided
  const { data: circleData } = useQuery<Circle>({
    queryKey: ["/api/circles", circleId],
    enabled: !!circleId && !!user,
  });
  
  // Determine which endpoint to query based on whether we're viewing a specific circle
  const postsEndpoint = circleId ? `/api/circles/${circleId}/posts` : `/api/posts/${user?.id}`;

  const { data: posts, isLoading, refetch } = useQuery<PostWithInteractions[]>({
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
          "flex-1 overflow-y-auto p-4 md:p-5",
          circleId && !circlePanelCollapsed ? "pl-2" : "",
          circleId && circlePanelCollapsed ? "pl-2" : ""
        )}>
          {/* Content container */}
          <div className="space-y-4 mx-auto max-w-3xl">
            {circleData && (
              <div className="p-3 border rounded-lg mb-2" style={{ borderColor: typeof circleData.color === 'string' ? circleData.color : '#e2e8f0' }}>
                <h1 className="text-xl font-bold flex items-center">
                  <span className="mr-2">{circleData.icon}</span>
                  {circleData.name}
                </h1>
                {circleData.description && (
                  <p className="text-muted-foreground text-sm">{circleData.description}</p>
                )}
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