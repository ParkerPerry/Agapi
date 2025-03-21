import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

const accountFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: user?.username || "",
      avatarUrl: user?.avatarUrl || "",
      bio: user?.bio || "",
    },
  });

  async function onSubmit(data: AccountFormValues) {
    if (!user) return;

    try {
      setIsSaving(true);
      // Use string interpolation for the URL
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // Invalidate the user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });

      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update your account. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={form.watch("avatarUrl")} />
                      <AvatarFallback className="text-2xl">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">Profile Picture</h3>
                      <p className="text-sm text-muted-foreground">
                        Your avatar will be shown across the platform
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/avatar.jpg"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for your profile picture
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a bit about yourself"
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Your bio will be visible on your public profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Password management is not available in this version.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                <p>
                  Deleting your account will remove all your personal data from our system. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    variant: "destructive",
                    title: "Operation not supported",
                    description: "Account deletion is not available in this version.",
                  });
                }}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}