import TaskQueue from "@/components/tasks/TaskQueue";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Queue | Mission Control",
  description: "Manage and monitor agent tasks",
};

export default function TasksPage() {
  return (
    <div className="container mx-auto p-6">
      <TaskQueue />
    </div>
  );
}
