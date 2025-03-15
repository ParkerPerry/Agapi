import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Post, AiFollower } from "@shared/schema";
import { Heart, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { createWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface PostCardProps {
  post: Post & {
    interactions: Array<{
      id: number;
      type: "like" | "comment";
      content?: string;
      aiFollowerId: number;
      aiFollower?: AiFollower;
      createdAt: Date;
    }>;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState(post.interactions);

  const form = useForm({
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    const socket = createWebSocket();

    socket.onmessage = (event) => {
      const interaction = JSON.parse(event.data);
      if (interaction.postId === post.id) {
        setInteractions((prev) => [...prev, interaction]);
      }
    };

    return () => {
      socket.close();
    };
  }, [post.id]);

  const replyMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId: number }) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/reply`, {
        content,
        parentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${user?.id}`] });
      form.reset();
    },
  });

  const likes = interactions.filter((i) => i.type === "like").length;
  const comments = interactions.filter((i) => i.type === "comment");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4 text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">{comments.length}</span>
          </div>
        </div>
        <div className="space-y-4">
          {comments.map((comment, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-8 w-8">
                  {comment.aiFollower?.avatarUrl && (
                    <img src={comment.aiFollower.avatarUrl} alt={comment.aiFollower?.name || 'AI'} />
                  )}
                  <AvatarFallback>{comment.aiFollower?.name?.[0] || 'AI'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{comment.aiFollower?.name || 'AI'}</p>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
              <Form {...form}>
                <form 
                  onSubmit={form.handleSubmit((data) => 
                    replyMutation.mutate({ content: data.content, parentId: comment.id })
                  )}
                  className="flex items-center space-x-2 pl-12"
                >
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={`Reply to ${comment.aiFollower?.name || 'AI'}...`}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={replyMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}