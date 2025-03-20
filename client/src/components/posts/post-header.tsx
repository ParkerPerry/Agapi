import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CardHeader } from "@/components/ui/card";
import { formatRelativeTime } from "@/utils/date";
import { Post } from "@shared/schema";

interface PostHeaderProps {
  post: Post;
}

export function PostHeader({ post }: PostHeaderProps) {
  return (
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
  );
}