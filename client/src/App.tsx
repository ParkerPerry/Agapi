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
import { useEffect } from "react";
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

  useEffect(() => {
    // Only create WebSocket connection when user is authenticated
    if (user && token) {
      console.log('User authenticated, creating WebSocket connection');
      
      // Set authentication token for WebSocket
      setWebSocketAuthToken(token);
      
      // Create the WebSocket connection
      const socket = createWebSocket();
      
      // After connection is established, we'll send authentication message
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendWebSocketMessage({
          type: 'authenticate',
          token
        });
      }
      
      return () => {
        console.log('Cleaning up WebSocket connection');
        setWebSocketAuthToken(null);
        closeWebSocket();
      };
    }
  }, [user?.id, token]); // Only recreate when user ID or token changes

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