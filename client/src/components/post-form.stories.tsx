import type { Meta, StoryObj } from "@storybook/react";
import { PostForm } from "./post-form";
import { Post } from "@shared/schema";

const meta = {
  title: "Components/Posts/PostForm",
  component: PostForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PostForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultCircleId: 1,
    defaultContent: "",
  },
};

export const WithError: Story = {
  args: {
    defaultCircleId: 1,
    defaultContent: "",
    error: "Failed to create post",
  },
};

export const Loading: Story = {
  args: {
    defaultCircleId: 1,
    defaultContent: "",
    isLoading: true,
  },
};