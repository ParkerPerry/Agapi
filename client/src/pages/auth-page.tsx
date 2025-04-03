import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, Circle } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Handle successful authentication and redirect
  const redirectWithDefaultCircle = async () => {
    try {
      // Fetch default circle
      const defaultCircle = await apiRequest("/api/default-circle", "GET") as Circle;
      if (defaultCircle && defaultCircle.id) {
        // Store in query cache
        queryClient.setQueryData(["/api/default-circle"], defaultCircle);
        // Redirect to home with default circle
        setLocation(`/?circle=${defaultCircle.id}`);
      } else {
        // Fallback to home if no default circle
        setLocation("/");
      }
    } catch (error) {
      console.error("Error fetching default circle:", error);
      // Fallback to home page on error
      setLocation("/");
    }
  };

  useEffect(() => {
    if (user) {
      redirectWithDefaultCircle();
    }
  }, [user]);

  // Setup login with special handling
  const handleLogin = async (data: any) => {
    try {
      await loginMutation.mutateAsync(data);
      // Redirect is handled by useEffect when user changes
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Setup register with special handling
  const handleRegister = async (data: any) => {
    try {
      await registerMutation.mutateAsync(data);
      // Redirect is handled by useEffect when user changes
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Return null early only after checking in useEffect
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Agapi</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Username</Label>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password</Label>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Username</Label>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password</Label>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex bg-muted items-center justify-center p-8">
        <div className="max-w-lg space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Your Personal Circle on Agapi</h1>
          <p className="text-lg text-muted-foreground">
            Experience social media in a new way with AI-powered followers that interact with your posts.
            Share your thoughts, receive instant feedback, and engage with unique AI personalities.
          </p>
        </div>
      </div>
    </div>
  );
}