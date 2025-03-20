import { Heart, MessageSquare } from "lucide-react";
import { PostWithInteractions } from "./post-types";

interface PostStatsProps {
  post: PostWithInteractions;
}

export function PostStats({ post }: PostStatsProps) {
  const likes = post.interactions.filter((i) => i.type === "like").length;
  const rootComments = post.interactions.filter(
    (i) => (i.type === "comment" || i.type === "reply") && !i.parentId
  ).length;

  return (
    <div className="flex items-center space-x-4 text-muted-foreground">
      <div className="flex items-center space-x-1">
        <Heart className="h-4 w-4" />
        <span className="text-sm">{likes}</span>
      </div>
      <div className="flex items-center space-x-1">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm">{rootComments}</span>
      </div>
    </div>
  );
}