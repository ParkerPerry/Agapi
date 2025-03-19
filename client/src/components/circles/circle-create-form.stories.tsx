import type { Meta, StoryObj } from "@storybook/react";
import { CircleCreateForm } from "./circle-create-form";
import { InsertCircle } from "@shared/schema";

const meta = {
  title: "Components/Circles/CircleCreateForm",
  component: CircleCreateForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CircleCreateForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: async (data: InsertCircle) => {
      console.log("Form submitted with data:", data);
      return { id: 1, ...data, userId: 1, createdAt: new Date(), isDefault: false };
    },
  },
};

export const WithError: Story = {
  args: {
    onSubmit: async () => {
      throw new Error("Failed to create circle");
    },
  },
};

export const Loading: Story = {
  args: {
    onSubmit: async (data: InsertCircle) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { id: 1, ...data, userId: 1, createdAt: new Date(), isDefault: false };
    },
  },
};