import type { Meta, StoryObj } from "@storybook/react";
import { CircleDetailsDialog } from "./circle-details-dialog";

const meta = {
  title: "Components/Circles/CircleDetailsDialog",
  component: CircleDetailsDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CircleDetailsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    circleId: 1,
  },
};

export const WithMockData: Story = {
  args: {
    circleId: 1,
  },
  parameters: {
    mockData: {
      circle: {
        id: 1,
        name: "Tech Enthusiasts",
        description: "A circle for tech lovers",
        icon: "💻",
        color: "#2563eb",
        visibility: "shared",
      },
      owner: {
        id: 1,
        username: "john_doe",
      },
      members: [
        {
          userId: 1,
          username: "john_doe",
          role: "owner",
        },
        {
          userId: 2,
          username: "jane_smith",
          role: "collaborator",
        },
      ],
      followers: [
        {
          id: 1,
          name: "TechBot",
          personality: "Tech enthusiast AI",
          avatarUrl: "https://example.com/avatar1.png",
        },
        {
          id: 2,
          name: "CodeGuru",
          personality: "Coding expert AI",
          avatarUrl: "https://example.com/avatar2.png",
        },
      ],
    },
  },
};
