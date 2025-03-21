import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { NavBar } from "@/components/nav-bar";
import { useToast } from "@/hooks/use-toast";
import { useUpdateUserProfile } from "@/lib/mutations/user-mutations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface UserProfileFormValues {
  avatarUrl: string;
  bio: string;
}

export default function UserProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const updateProfileMutation = useUpdateUserProfile();
  
  const form = useForm<UserProfileFormValues>({
    defaultValues: {
      avatarUrl: user?.avatarUrl || "",
      bio: user?.bio || "",
    },
  });
  
  if (!user) {
    return null;
  }
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    // Reset form values to current user values
    form.reset({
      avatarUrl: user.avatarUrl || "",
      bio: user.bio || "",
    });
    setIsEditing(false);
  };
  
  const handleSubmit = (data: UserProfileFormValues) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        setIsEditing(false);
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };
  
  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-2xl">User Profile</CardTitle>
              <CardDescription>View and edit your profile information</CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={form.watch("avatarUrl")} />
                  <AvatarFallback className="text-2xl">{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-semibold">{user.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.jpg"
                      disabled={!isEditing}
                      {...form.register("avatarUrl")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      disabled={!isEditing}
                      className="min-h-[120px]"
                      {...form.register("bio")}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  {isEditing ? (
                    <>
                      <Button variant="outline" type="button" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={handleEdit}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}