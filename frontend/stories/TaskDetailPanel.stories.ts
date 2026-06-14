import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { fn } from "storybook/test";

import TaskDetailPanel from "../components/wbs/TaskDetailPanel";

const sampleTask = {
  id: 1,
  project_id: 1,
  parent_id: null,
  name: "サンプルタスク",
  description: null,
  assignee: "田中太郎",
  start_date: "2026-06-01",
  end_date: "2026-06-30",
  progress: 40,
  status: "進行中",
  sort_order: 0,
  is_deleted: false,
};

const meta = {
  title: "WBS/TaskDetailPanel",
  component: TaskDetailPanel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    task: sampleTask,
    open: true,
    onClose: fn(),
    onSave: fn(),
  },
} satisfies Meta<typeof TaskDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyFields: Story = {
  args: {
    task: {
      ...sampleTask,
      assignee: null,
      start_date: null,
      end_date: null,
      progress: 0,
      status: "未着手",
    },
  },
};

export const FullProgress: Story = {
  args: {
    task: {
      ...sampleTask,
      progress: 100,
      status: "完了",
    },
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
};
