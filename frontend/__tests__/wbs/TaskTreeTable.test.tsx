import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TaskTreeTable from "../../components/wbs/TaskTreeTable";
import type { Task } from "../../types/task";

const makeTask = (overrides: Partial<Task> & { id: number; name: string }): Task => ({
  project_id: 1,
  parent_id: null,
  description: null,
  assignee: null,
  start_date: null,
  end_date: null,
  progress: 0,
  status: "not_started",
  sort_order: 0,
  is_deleted: false,
  ...overrides,
});

const sampleTasks: Task[] = [
  makeTask({ id: 1, name: "親タスク", parent_id: null, sort_order: 0 }),
  makeTask({ id: 2, name: "子タスク", parent_id: 1, sort_order: 0 }),
];

describe("TaskTreeTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("空状態", () => {
    it("TaskTreeTable_タスクが0件のとき_空状態プレースホルダが表示される", () => {
      // given
      const tasks: Task[] = [];

      // when
      render(<TaskTreeTable projectId={1} initialTasks={tasks} />);

      // then
      expect(screen.getByText(/タスクがありません/)).toBeInTheDocument();
    });
  });

  describe("タスク追加（AC 1）", () => {
    it("TaskTreeTable_タスクを追加ボタンをクリックしたとき_新しい入力行が追加される", () => {
      // given
      render(<TaskTreeTable projectId={1} initialTasks={[]} />);
      const addButton = screen.getByRole("button", { name: /タスクを追加/ });

      // when
      fireEvent.click(addButton);

      // then
      expect(screen.getByRole("textbox", { name: /タスク名/ })).toBeInTheDocument();
    });
  });

  describe("インライン編集（AC 2）", () => {
    it("TaskTreeTable_タスク名をクリックしたとき_インライン編集モードになる", () => {
      // given
      render(<TaskTreeTable projectId={1} initialTasks={sampleTasks} />);
      const taskName = screen.getByText("親タスク");

      // when
      fireEvent.click(taskName);

      // then
      expect(screen.getByDisplayValue("親タスク")).toBeInTheDocument();
    });
  });

  describe("タスク削除（AC 3）", () => {
    it("TaskTreeTable_削除ボタンをクリックしたとき_タスクが一覧から消える", async () => {
      // given
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      render(<TaskTreeTable projectId={1} initialTasks={[makeTask({ id: 1, name: "削除対象タスク" })]} />);
      const deleteButton = screen.getByRole("button", { name: /削除/ });

      // when
      fireEvent.click(deleteButton);

      // then
      await waitFor(() => {
        expect(screen.queryByText("削除対象タスク")).not.toBeInTheDocument();
      });
    });
  });

  describe("折りたたみ・展開（AC 4）", () => {
    it("TaskTreeTable_子タスクを持つ親の折りたたみアイコンをクリックしたとき_子タスクが非表示になる", () => {
      // given
      render(<TaskTreeTable projectId={1} initialTasks={sampleTasks} />);
      expect(screen.getByText("子タスク")).toBeInTheDocument();
      const collapseButton = screen.getByRole("button", { name: /折りたたむ/ });

      // when
      fireEvent.click(collapseButton);

      // then
      expect(screen.queryByText("子タスク")).not.toBeInTheDocument();
    });
  });

  describe("全展開・全折りたたみ（AC 5）", () => {
    it("TaskTreeTable_全展開ボタンをクリックしたとき_折りたたまれた子タスクが表示される", () => {
      // given
      render(<TaskTreeTable projectId={1} initialTasks={sampleTasks} />);
      const collapseButton = screen.getByRole("button", { name: /折りたたむ/ });
      fireEvent.click(collapseButton);
      expect(screen.queryByText("子タスク")).not.toBeInTheDocument();
      const expandAllButton = screen.getByRole("button", { name: /全展開/ });

      // when
      fireEvent.click(expandAllButton);

      // then
      expect(screen.getByText("子タスク")).toBeInTheDocument();
    });

    it("TaskTreeTable_全折りたたみボタンをクリックしたとき_子タスクが非表示になる", () => {
      // given
      render(<TaskTreeTable projectId={1} initialTasks={sampleTasks} />);
      expect(screen.getByText("子タスク")).toBeInTheDocument();
      const collapseAllButton = screen.getByRole("button", { name: /全折りたたみ/ });

      // when
      fireEvent.click(collapseAllButton);

      // then
      expect(screen.queryByText("子タスク")).not.toBeInTheDocument();
    });
  });
});
