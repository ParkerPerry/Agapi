import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Calendar } from "lucide-react";
import { format } from "date-fns";

interface LabPostFormProps {
  labId: number;
}

export function LabPostForm({ labId }: LabPostFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; scheduledFor?: string }) => {
      setSubmitting(true);
      return await apiRequest(`/api/labs/${labId}/posts`, "POST", data);
    },
    onSuccess: () => {
      // Reset form
      setContent("");
      setScheduledDate("");
      
      // Show success message
      toast({
        title: "Post created",
        description: "Your post has been added to the lab."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${labId}/posts`] });
      
      setSubmitting(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
      
      setSubmitting(false);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }
    
    const data: { content: string; scheduledFor?: string } = {
      content: content.trim(),
    };
    
    if (scheduledDate) {
      data.scheduledFor = new Date(scheduledDate).toISOString();
    }
    
    createPostMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Lab Post</CardTitle>
        <CardDescription>
          Add posts that will be shared in this lab's circle
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="What do you want to post in this lab?"
              className="h-32 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={submitting}
            />
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">Schedule post (optional)</div>
          </div>
          
          <div>
            <Input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={submitting}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>
        </CardContent>
        
        <CardFooter className="justify-end">
          <Button 
            type="submit" 
            disabled={submitting || !content.trim()}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {scheduledDate ? "Schedule Post" : "Create Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}