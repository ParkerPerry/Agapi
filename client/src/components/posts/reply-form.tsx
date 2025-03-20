import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Send } from "lucide-react";
import { ReplyFormProps } from "./post-types";

export function ReplyForm({ postId, commentId, aiFollowerName, onReply }: ReplyFormProps) {
  const { user } = useAuth();
  const form = useForm({
    defaultValues: {
      content: "",
    },
  });

  // Extract the circleId from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const circleId = params.get('circle') || '';

  const replyMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/reply`, {
        content,
        parentId: commentId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate both user posts and circle posts queries to ensure UI updates properly
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${user?.id}`] });
      
      // If we're in a circle view, invalidate that circle's posts query
      if (circleId) {
        queryClient.invalidateQueries({ queryKey: [`/api/circles/${circleId}/posts`] });
      }
      
      // Always invalidate all possible circles that might contain this post
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return queryKey.startsWith('/api/circles/') && queryKey.endsWith('/posts');
        } 
      });
      
      form.reset();
      onReply();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => replyMutation.mutate(data))} className="flex items-center space-x-2">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input {...field} placeholder={`Reply to ${aiFollowerName}...`} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={replyMutation.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}