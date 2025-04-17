import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/posts/post-card";
import { 
  Shield, 
  Sparkles, 
  Eye, 
  Users, 
  FilterX, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Post } from "@shared/schema";

// Role information for the UI
const roleInfo = {
  control: {
    name: "Control",
    description: "Content targeting the control group",
    icon: <Shield className="h-4 w-4" />,
    color: "blue",
    bgClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  treatment: {
    name: "Treatment",
    description: "Content targeting the treatment group",
    icon: <Sparkles className="h-4 w-4" />,
    color: "amber",
    bgClass: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  },
  observation: {
    name: "Observation",
    description: "Content targeting the observation group",
    icon: <Eye className="h-4 w-4" />,
    color: "violet",
    bgClass: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  },
  all: {
    name: "All Groups",
    description: "Content targeting all groups",
    icon: <Users className="h-4 w-4" />,
    color: "gray",
    bgClass: "bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400",
  }
};

interface LabContentViewProps {
  labId: number;
}

export function LabContentView({ labId }: LabContentViewProps) {
  const [activeRole, setActiveRole] = useState<"all" | "control" | "treatment">("all");
  
  // Fetch lab posts with the selected role filter
  const {
    data: posts,
    isLoading,
    error,
    refetch
  } = useQuery<(Post & { interactions: any[], pendingResponses: any[], circle: {id: number, name: string, role: string} | null })[]>({
    queryKey: [`/api/labs/${labId}/posts`, activeRole],
    queryFn: async () => {
      const res = await fetch(`/api/labs/${labId}/posts${activeRole !== "all" ? `?role=${activeRole}` : ""}`);
      if (!res.ok) {
        throw new Error("Failed to fetch lab posts");
      }
      return res.json();
    },
    enabled: !!labId,
  });

  // Add debugging so we can see what's happening
  console.log("Lab posts data for lab " + labId + " (" + activeRole + " tab):", {
    postCount: posts?.length || 0,
    posts: posts?.map(post => ({
      id: post.id,
      targetRole: post.targetRole,
      circleId: post.circleId,
      circleName: post.circle?.name,
      circleRole: post.circle?.role
    }))
  });
  
  // These count totals will show how many posts would appear in each tab
  const postCounts = {
    // All tab shows all posts
    all: posts?.length || 0,
    
    // Control tab count should reflect posts in control circles regardless of targetRole
    control: posts?.filter(post => post.circle?.role === "control").length || 0,
    
    // Treatment tab count should reflect posts in treatment circles regardless of targetRole
    treatment: posts?.filter(post => post.circle?.role === "treatment").length || 0
  };
  
  // Log the counts for debugging
  console.log("Post counts:", postCounts);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Lab Content</CardTitle>
        <CardDescription>
          View and analyze content targeted to different experimental groups
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue={activeRole} value={activeRole} onValueChange={(value) => setActiveRole(value as any)}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex gap-1 items-center">
              {roleInfo.all.icon}
              <span>All ({postCounts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="control" className="flex gap-1 items-center">
              {roleInfo.control.icon}
              <span>Control ({postCounts.control})</span>
            </TabsTrigger>
            <TabsTrigger value="treatment" className="flex gap-1 items-center">
              {roleInfo.treatment.icon}
              <span>Treatment ({postCounts.treatment})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className="my-4" />

        <CardContent>
          <TabsContent value={activeRole} className="mt-0">
            {isLoading ? (
              // Loading state
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="text-center py-8 border rounded-lg">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-2" />
                <p className="text-lg text-destructive font-medium">
                  Failed to load lab content
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error retrieving the lab posts
                </p>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  className="mx-auto flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : posts?.length === 0 ? (
              // No posts state
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FilterX className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No posts found</h3>
                <p className="text-muted-foreground">
                  {activeRole === "all"
                    ? "This lab doesn't have any experimental posts yet."
                    : `No ${activeRole} group posts found in this lab.`}
                </p>
              </div>
            ) : (
              // Display posts
              <div className="space-y-4">
                {posts?.map((post) => (
                  <div key={post.id} className="relative">
                    {/* Role indicator */}
                    <div className="absolute top-0 right-0 z-10 mt-2 mr-2">
                      <Badge 
                        variant="outline" 
                        className={`${roleInfo[post.targetRole as keyof typeof roleInfo]?.bgClass || roleInfo.all.bgClass} flex items-center gap-1`}
                      >
                        {roleInfo[post.targetRole as keyof typeof roleInfo]?.icon || roleInfo.all.icon}
                        <span>{post.targetRole ? `${post.targetRole.charAt(0).toUpperCase()}${post.targetRole.slice(1)}` : "All"}</span>
                      </Badge>
                    </div>
                    
                    {/* Circle indicator if available */}
                    {post.circle && (
                      <div className="absolute top-0 left-0 z-10 mt-2 ml-2">
                        <Badge variant="secondary" className="text-xs">
                          Circle: {post.circle.name}
                        </Badge>
                      </div>
                    )}
                    
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}