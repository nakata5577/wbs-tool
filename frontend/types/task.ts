export interface Task {
  id: number;
  project_id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  assignee: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  status: string;
  sort_order: number;
  is_deleted: boolean;
}
