import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { formatRelativeTime } from "@/utils/date";
import { ReplyForm } from "./reply-form";
import { PendingResponses } from "./pending-responses";
import { ToolsUsedIndicator } from "./tools-used-indicator";
import { CommentProps } from "./post-types";

export function Comment({ comment, postId, level = 0 }: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { user } = useAuth();

  const isAIComment = !!comment.aiFollowerId;
  const isUserComment = !!comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const pendingResponses = comment.pendingResponses || [];

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
          
          {/* Display tool usage indicator for AI comments with tools used */}
          {isAIComment && comment.toolsUsed && (
            <ToolsUsedIndicator toolsUsed={comment.toolsUsed} />
          )}
          
          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center space-x-2">
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
            {pendingResponses.length > 0 && (
              <PendingResponses 
                pendingResponses={pendingResponses} 
                postId={postId} 
              />
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