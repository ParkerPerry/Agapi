import type { Meta, StoryObj } from "@storybook/react";
import { CircleCard } from "./circle-card";

const meta = {
  title: "Components/Circles/CircleCard",
  component: CircleCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CircleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    circle: {
      id: 1,
      name: "Tech Discussions",
      description: "A circle for tech enthusiasts",
      icon: "💻",
      color: "#2563eb",
      visibility: "private",
      userId: 1,
      isDefault: false,
      createdAt: new Date(),
    },
    onEdit: () => console.log("Edit clicked"),
    onDelete: () => console.log("Delete clicked"),
  },
};

export const DefaultCircle: Story = {
  args: {
    circle: {
      id: 1,
      name: "Home",
      description: "Your personal space for sharing and connecting",
      icon: "🏠",
      color: "#2563eb",
      visibility: "private",
      userId: 1,
      isDefault: true,
      createdAt: new Date(),
    },
  },
};

export const SharedCircle: Story = {
  args: {
    circle: {
      id: 1,
      name: "Global Tech Hub",
      description: "Public discussions about technology",
      icon: "🌐",
      color: "#10b981",
      visibility: "shared",
      userId: 1,
      isDefault: false,
      createdAt: new Date(),
    },
  },
};