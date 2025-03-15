import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Post } from "@shared/schema";
import { Heart, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { createWebSocket } from "@/lib/websocket";

interface PostCardProps {
  post: Post & {
    interactions: Array<{
      type: "like" | "comment";
      content?: string;
      aiFollowerId: number;
    }>;
  };
}

export function PostCard({ post }: PostCardProps) {
  const [interactions, setInteractions] = useState(post.interactions);

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
        {comments.map((comment, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <p className="text-sm flex-1">{comment.content}</p>
          </div>
        ))}
      </CardFooter>
    </Card>
  );
}
