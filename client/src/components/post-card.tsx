import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Post, AiFollower } from "@shared/schema";
import { Heart, MessageSquare, Send, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime } from "@/utils/date";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PostCardProps {
  post: Post & {
    interactions: Array<{
      id: number;
      type: "like" | "comment" | "reply";
      content?: string;
      aiFollowerId?: number;
      aiFollower?: AiFollower;
      userId?: number;
      parentId?: number;
      createdAt: Date;
      replies?: Array<{
        id: number;
        type: "like" | "comment" | "reply";
        content?: string;
        aiFollowerId?: number;
        aiFollower?: AiFollower;
        userId?: number;
        parentId?: number;
        createdAt: Date;
      }>;
    }>;
    pendingResponses?: Array<{
      id: number;
      name: string;
      avatarUrl: string;
      scheduledFor: Date;
    }>;
  };
}

function ReplyForm({ postId, commentId, aiFollowerName, onReply }: {
  postId: number;
  commentId: number;
  aiFollowerName: string;
  onReply: () => void;
}) {
  const { user } = useAuth();
  const form = useForm({
    defaultValues: {
      content: "",
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/reply`, {
        content,
        parentId: commentId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${user?.id}`] });
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

function Comment({
  comment,
  postId,
  level = 0,
}: {
  comment: PostCardProps["post"]["interactions"][0];
  postId: number;
  level?: number;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { user } = useAuth();

  const isAIComment = !!comment.aiFollowerId;
  const isUserComment = !!comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={`space-y-4 ${level > 0 ? "ml-8 border-l-2 pl-4" : ""}`}>
      <div className="flex items-start space-x-4">
        <Avatar className="h-8 w-8">
          {isAIComment && comment.aiFollower?.avatarUrl && (
            <img
              src={comment.aiFollower.avatarUrl}
              alt={comment.aiFollower.name}
              className="h-full w-full object-cover"
            />
          )}
          <AvatarFallback>
            {isAIComment ? comment.aiFollower?.name[0] || 'AI' : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {isAIComment ? comment.aiFollower?.name || 'AI' : 'You'}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.content}</p>
          <div className="flex items-center space-x-2 mt-2">
            {!isReplying && isAIComment && user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(true)}
                className="reply-button"
              >
                Reply
              </Button>
            )}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? "Hide Replies" : `Show Replies (${comment.replies?.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="ml-8">
          <ReplyForm
            postId={postId}
            commentId={comment.id}
            aiFollowerName={comment.aiFollower?.name || "AI"}
            onReply={() => setIsReplying(false)}
          />
        </div>
      )}

      {showReplies && comment.replies && comment.replies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          postId={postId}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function PostCard({ post }: PostCardProps) {
  const likes = post.interactions.filter((i) => i.type === "like").length;
  const rootComments = post.interactions.filter(
    (i) => (i.type === "comment" || i.type === "reply") && !i.parentId
  );
  const pendingCount = post.pendingResponses?.length || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-x-4">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">{rootComments.length}</span>
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {post.pendingResponses?.map((follower) => (
                  <HoverCard key={follower.id}>
                    <HoverCardTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <img
                          src={follower.avatarUrl}
                          alt={follower.name}
                          className="h-full w-full object-cover"
                        />
                        <AvatarFallback>{follower.name[0]}</AvatarFallback>
                      </Avatar>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60">
                      <div className="flex justify-between space-x-4">
                        <Avatar>
                          <img
                            src={follower.avatarUrl}
                            alt={follower.name}
                            className="h-full w-full object-cover"
                          />
                          <AvatarFallback>{follower.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold">{follower.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Will respond {formatRelativeTime(follower.scheduledFor)}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
          {rootComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={post.id}
            />
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}