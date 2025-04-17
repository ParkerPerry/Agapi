import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AiFollowersPage from "@/pages/ai-followers-page";
import CirclesPage from "@/pages/circles-page";
import LabsPage from "@/pages/labs-page";
import LabDetailPage from "@/pages/lab-detail-page";
import FollowerConfigPage from "@/pages/follower-config-page";
import UserProfilePage from "@/pages/user-profile-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { createWebSocket, closeWebSocket, setWebSocketAuthToken, sendWebSocketMessage } from "@/lib/websocket";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TourProvider } from "@/components/tour/tour-context";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/ai-followers" component={AiFollowersPage} />
      <ProtectedRoute path="/circles" component={CirclesPage} />
      <ProtectedRoute path="/labs" component={LabsPage} />
      <ProtectedRoute path="/labs/:id" component={LabDetailPage} />
      <ProtectedRoute path="/ai-followers/config/:id" component={FollowerConfigPage} />
      <ProtectedRoute path="/profile" component={UserProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainApp() {
  const { user, token } = useAuth();

  const [wsConnectionFailed, setWsConnectionFailed] = useState(false);
  
  // Subscribe to WebSocket connection errors
  useEffect(() => {
    const errorHandler = () => {
      setWsConnectionFailed(true);
    };
    
    window.addEventListener('websocket-connection-failed', errorHandler);
    
    return () => {
      window.removeEventListener('websocket-connection-failed', errorHandler);
    };
  }, []);
  
  // WebSocket connection and authentication
  useEffect(() => {
    // Only create WebSocket connection when user is authenticated
    if (user && token) {
      console.log('User authenticated, creating WebSocket connection');
      
      // Reset connection failed state on new attempt
      setWsConnectionFailed(false);
      
      // Set authentication token for WebSocket
      setWebSocketAuthToken(token);
      
      // Create the WebSocket connection
      const socket = createWebSocket();
      
      // Set up listener to send auth message when connection opens
      const authListener = (event: Event) => {
        console.log('WebSocket open event, sending authentication');
        sendWebSocketMessage({
          type: 'authenticate',
          token
        });
      };
      
      // If socket exists and is already open, authenticate now
      if (socket) {
        if (socket.readyState === WebSocket.OPEN) {
          console.log('Socket already open, authenticating now');
          sendWebSocketMessage({
            type: 'authenticate',
            token
          });
        } else {
          // Otherwise wait for connection to open
          socket.addEventListener('open', authListener);
        }
      }
      
      return () => {
        console.log('Cleaning up WebSocket connection');
        // Remove auth listener if socket exists
        if (socket) {
          socket.removeEventListener('open', authListener);
        }
        setWebSocketAuthToken(null);
        closeWebSocket();
      };
    }
  }, [user?.id, token]); // Only recreate when user ID or token changes
  
  // Message to show if WebSocket connection fails
  const { toast } = useToast();
  
  useEffect(() => {
    if (wsConnectionFailed) {
      // Use toast to inform user about WebSocket connection failure
      // This is non-blocking so users can still use the app
      toast({
        title: "Real-time updates unavailable",
        description: "Some features like instant notifications may not work. The app will still function normally.",
        variant: "warning",
        duration: 5000
      });
    }
  }, [wsConnectionFailed, toast]);

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <MainApp />
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;