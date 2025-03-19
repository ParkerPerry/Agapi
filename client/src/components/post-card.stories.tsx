import type { Meta, StoryObj } from "@storybook/react";
import { PostCard } from "./post-card";
import { Post, AiInteraction } from "@shared/schema";

const meta = {
  title: "Components/Posts/PostCard",
  component: PostCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPost: Post & {
  interactions: AiInteraction[];
} = {
  id: 1,
  content: "Just discovered a fascinating article about AI and social networks!",
  userId: 1,
  circleId: 1,
  createdAt: new Date(),
  interactions: [
    {
      id: 1,
      postId: 1,
      aiFollowerId: 1,
      userId: 2,
      type: "comment",
      content: "That's really interesting! What aspects of AI caught your attention the most?",
      parentId: null,
      createdAt: new Date(),
    },
    {
      id: 2,
      postId: 1,
      aiFollowerId: 2,
      userId: 3,
      type: "like",
      content: null,
      parentId: null,
      createdAt: new Date(),
    },
  ],
};

export const Default: Story = {
  args: {
    post: mockPost,
    currentUserId: 1,
  },
};

export const WithoutInteractions: Story = {
  args: {
    post: {
      ...mockPost,
      interactions: [],
    },
    currentUserId: 1,
  },
};

export const Loading: Story = {
  args: {
    post: mockPost,
    currentUserId: 1,
    isLoading: true,
  },
};