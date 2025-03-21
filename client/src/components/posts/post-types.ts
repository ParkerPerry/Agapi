import { Post, AiFollower } from "@shared/schema";

// Interaction types
export interface Interaction {
  id: number;
  type: "like" | "comment" | "reply";
  content?: string;
  aiFollowerId?: number;
  aiFollower?: AiFollower;
  userId?: number;
  parentId?: number;
  createdAt: Date;
  toolsUsed?: {
    used: boolean;
    tools: Array<{
      id: string;
      name: string;
      usageCount: number;
      examples: string[];
    }>;
  };
}

export interface ThreadedInteraction extends Interaction {
  replies?: ThreadedInteraction[];
  pendingResponses?: PendingResponse[];
}

// Pending response type
export interface PendingResponse {
  id: number;
  name: string;
  avatarUrl: string;
  scheduledFor: Date;
}

// Post with extended data
export interface PostWithInteractions extends Post {
  interactions: ThreadedInteraction[];
  pendingResponses?: PendingResponse[];
}

// Props for the PostCard component
export interface PostCardProps {
  post: PostWithInteractions;
}

// Props for the Comment component
export interface CommentProps {
  comment: ThreadedInteraction;
  postId: number;
  level?: number;
}

// Props for the ReplyForm component
export interface ReplyFormProps {
  postId: number;
  commentId: number;
  aiFollowerName: string;
  onReply: () => void;
}

// Props for the PendingResponses component
export interface PendingResponsesProps {
  pendingResponses: PendingResponse[];
  postId: number;
}