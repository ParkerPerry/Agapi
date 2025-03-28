import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle,
  Trash2,
  RefreshCw,
  PlayCircle,
  CalendarX
} from "lucide-react";
import { formatRelativeTime, formatSimpleDate } from "@/utils/date";

interface LabPost {
  id: number;
  content: string;
  postOrder: number;
  status: 'pending' | 'posted' | 'completed';
  scheduledFor: string | null;
  actualPostedAt: string | null;
  createdAt: string;
}

interface LabPostsListProps {
  labId: number;
}

export function LabPostsList({ labId }: LabPostsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch lab posts
  const { data: posts = [], isLoading } = useQuery<LabPost[]>({
    queryKey: [`/api/labs/${labId}/posts`],
    queryFn: async () => {
      try {
        return await apiRequest(`/api/labs/${labId}/posts`);
      } catch (error) {
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
    },
  });
  
  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/labs/${labId}/posts/${postId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${labId}/posts`] });
      
      toast({
        title: "Post deleted",
        description: "The post has been removed from the lab."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Post status actions mutation
  const updatePostStatusMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: number; action: string }) => {
      return await apiRequest(`/api/labs/${labId}/posts/${postId}/${action}`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${labId}/posts`] });
      
      toast({
        title: "Post updated",
        description: "The post status has been updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Handle post action
  const handlePostAction = (postId: number, action: string) => {
    updatePostStatusMutation.mutate({ postId, action });
  };
  
  // Handle post delete
  const handlePostDelete = (postId: number) => {
    deletePostMutation.mutate(postId);
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "posted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5" />;
      case "posted":
        return <PlayCircle className="h-3.5 w-3.5" />;
      case "completed":
        return <Check className="h-3.5 w-3.5" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };
  
  // Sort posts by order and date
  const sortedPosts = [...posts].sort((a, b) => {
    // First by status (completed last)
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    
    // Then by scheduled date
    if (a.scheduledFor && b.scheduledFor) {
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    }
    
    // Finally by post order
    return a.postOrder - b.postOrder;
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lab Posts</CardTitle>
        <CardDescription>
          {posts.length === 0 
            ? "Add posts to include in this lab experiment" 
            : `${posts.length} post${posts.length !== 1 ? 's' : ''} in this lab`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarX className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No posts added yet</p>
            <p className="text-sm">Create a post using the form on the left</p>
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-[150px]">Schedule</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="line-clamp-2">{post.content}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                        <div>
                          {post.scheduledFor 
                            ? formatSimpleDate(post.scheduledFor)
                            : "Immediate"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`gap-1 ${getStatusBadge(post.status)}`}
                        variant="outline"
                      >
                        {getStatusIcon(post.status)}
                        <span>
                          {post.status === "pending" && "Pending"}
                          {post.status === "posted" && "Posted"}
                          {post.status === "completed" && "Completed"}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {post.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePostAction(post.id, "post-now")}
                            title="Post now"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {post.status === "posted" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePostAction(post.id, "refresh")}
                            title="Refresh responses"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {post.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handlePostDelete(post.id)}
                            title="Delete post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}