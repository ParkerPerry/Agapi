import type { Meta, StoryObj } from "@storybook/react";
import { NavBar } from "./nav-bar";

const meta = {
  title: "Components/Navigation/NavBar",
  component: NavBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    user: {
      id: 1,
      username: "john_doe",
      avatarUrl: "https://github.com/shadcn.png",
      createdAt: new Date(),
    },
  },
};

export const LoggedOut: Story = {
  args: {
    user: null,
  },
};

export const WithNotifications: Story = {
  args: {
    user: {
      id: 1,
      username: "john_doe",
      avatarUrl: "https://github.com/shadcn.png",
      createdAt: new Date(),
    },
    notificationCount: 3,
  },
};
