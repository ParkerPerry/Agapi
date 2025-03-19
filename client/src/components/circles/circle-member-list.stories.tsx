import type { Meta, StoryObj } from "@storybook/react";
import { CircleMemberList } from "./circle-member-list";
import { CircleMember } from "@shared/schema";

const meta = {
  title: "Components/Circles/CircleMemberList",
  component: CircleMemberList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CircleMemberList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockMembers: (CircleMember & { username: string })[] = [
  {
    id: 1,
    circleId: 1,
    userId: 1,
    username: "john_doe",
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  },
  {
    id: 2,
    circleId: 1,
    userId: 2,
    username: "jane_smith",
    role: "collaborator",
    status: "active",
    joinedAt: new Date(),
  },
  {
    id: 3,
    circleId: 1,
    userId: 3,
    username: "bob_wilson",
    role: "viewer",
    status: "active",
    joinedAt: new Date(),
  },
];

export const Default: Story = {
  args: {
    members: mockMembers,
    circleId: 1,
    isOwner: false,
  },
};

export const Loading: Story = {
  args: {
    members: [],
    circleId: 1,
    isOwner: false,
  },
};

export const Empty: Story = {
  args: {
    members: [],
    circleId: 1,
    isOwner: false,
  },
};