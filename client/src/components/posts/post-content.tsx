import { CardContent } from "@/components/ui/card";
import { Post } from "@shared/schema";

interface PostContentProps {
  post: Post;
}

export function PostContent({ post }: PostContentProps) {
  return (
    <CardContent>
      <p className="whitespace-pre-wrap">{post.content}</p>
    </CardContent>
  );
}