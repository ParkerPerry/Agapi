import { Card, CardFooter } from "@/components/ui/card";
import { PostHeader } from "./post-header";
import { PostContent } from "./post-content";
import { PostStats } from "./post-stats";
import { PendingResponses } from "./pending-responses";
import { Comment } from "./comment";
import { PostCardProps } from "./post-types";

export function PostCard({ post }: PostCardProps) {
  // Add null/undefined check for interactions
  const rootComments = (post.interactions || []).filter(
    (i) => (i.type === "comment" || i.type === "reply") && !i.parentId
  );
  const pendingResponses = post.pendingResponses || [];

  return (
    <Card>
      <PostHeader post={post} />
      <PostContent post={post} />
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex items-center justify-between w-full">
          <PostStats post={post} />
          {pendingResponses.length > 0 && (
            <PendingResponses 
              pendingResponses={pendingResponses} 
              postId={post.id} 
            />
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