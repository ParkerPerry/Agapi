import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";


// Placeholder for WebSocket subscription function.  Replace with actual implementation.
const subscribeToWebSocket = (callback) => {
  //  Implementation to connect to WebSocket and handle messages
  //  Example using a mock WebSocket:
  const ws = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket URL
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      callback(data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  ws.onclose = () => console.log("WebSocket connection closed");
  ws.onerror = (error) => console.error("WebSocket error:", error);

  return () => {
    ws.close();
  };
};


export default function HomePage() {
  const { user } = useAuth();
  const { data: posts, isLoading, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [`/api/posts/${user?.id}`],
  });

  // Fetch posts on mount and on user change
  useEffect(() => {
    refetch();

    // Subscribe to WebSocket updates
    const unsubscribe = subscribeToWebSocket((data) => {
      if (data.type === 'thread-update' || data.type === 'comment') {
        console.log('Received WebSocket update:', data);
        // Refetch posts to get the latest data
        refetch();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user, refetch]);

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