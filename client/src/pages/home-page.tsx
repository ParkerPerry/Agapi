import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { PostForm } from "@/components/post-form";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

// WebSocket implementation
let websocket;
const createWebSocket = () => {
  if (websocket) {
    return; // WebSocket already initialized
  }
  websocket = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket URL
  websocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Handle WebSocket messages here.  This example just logs the data.
      console.log('WebSocket message received:', data);
      //Implement logic to update UI based on data
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };
  websocket.onclose = () => {
    console.log("WebSocket connection closed");
    // Optionally attempt to reconnect
  };
  websocket.onerror = (error) => console.error("WebSocket error:", error);
};

const closeWebSocket = () => {
    if (websocket) {
        websocket.close();
        websocket = null;
    }
};

export default function HomePage() {
  const { user } = useAuth();

  // Initialize WebSocket connection
  useEffect(() => {
    createWebSocket();
    return () => closeWebSocket();
  }, []);

  const { data: posts, isLoading, refetch } = useQuery<(Post & { interactions: any[] })[]>({
    queryKey: [`/api/posts/${user?.id}`],
  });

  // Fetch posts on mount and on user change
  useEffect(() => {
    refetch();
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