import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// NOTE: TaskDetailPanel はまだ存在しないため、このimportはコンパイルエラー（Red）になる
import TaskDetailPanel from "../../components/wbs/TaskDetailPanel";
import type { Task } from "../../types/task";

const makeTask = (overrides: Partial<Task> & { id: number; name: string }): Task => ({
  project_id: 1,
  parent_id: null,
  description: null,
  assignee: null,
  start_date: null,
  end_date: null,
  progress: 0,
  status: "未着手",
  sort_order: 0,
  is_deleted: false,
  ...overrides,
});

const sampleTask = makeTask({ id: 1, name: "サンプルタスク" });

describe("TaskDetailPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // AC1: タスクをクリックすると右からパネルがスライドインする
  describe("パネルの表示・非表示（AC1）", () => {
    it("TaskDetailPanel_open が true のとき_パネルタイトルが表示される", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();

      // when
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // then
      expect(screen.getByText("タスク詳細")).toBeInTheDocument();
    });

    it("TaskDetailPanel_open が false のとき_パネルタイトルが表示されない", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();

      // when
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={false}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // then
      expect(screen.queryByText("タスク詳細")).not.toBeInTheDocument();
    });
  });

  // AC2: 担当者フィールドを入力して保存すると PATCH /api/tasks/{id} が呼ばれる
  describe("担当者入力（AC2）", () => {
    it("TaskDetailPanel_担当者フィールドを入力して保存ボタンをクリックしたとき_assignee フィールドと共に PATCH が呼ばれる", async () => {
      // given
      const updatedTask = makeTask({ id: 1, name: "サンプルタスク", assignee: "山田太郎" });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedTask,
      });
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      const assigneeInput = screen.getByLabelText(/担当者/);
      fireEvent.change(assigneeInput, { target: { value: "山田太郎" } });

      // when
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/1",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"assignee":"山田太郎"'),
          }),
        );
      });
    });
  });

  // AC3: 開始日・終了日をカレンダーピッカーで入力して保存すると PATCH が呼ばれる
  describe("開始日・終了日入力（AC3）", () => {
    it("TaskDetailPanel_開始日を入力して保存したとき_start_date フィールドと共に PATCH が呼ばれる", async () => {
      // given
      const updatedTask = makeTask({ id: 1, name: "サンプルタスク", start_date: "2026-06-15" });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedTask,
      });
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      const startDateInput = screen.getByLabelText(/開始日/);
      fireEvent.change(startDateInput, { target: { value: "2026-06-15" } });

      // when
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/1",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"start_date":"2026-06-15"'),
          }),
        );
      });
    });

    it("TaskDetailPanel_終了日を入力して保存したとき_end_date フィールドと共に PATCH が呼ばれる", async () => {
      // given
      const updatedTask = makeTask({ id: 1, name: "サンプルタスク", end_date: "2026-06-30" });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedTask,
      });
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      const endDateInput = screen.getByLabelText(/終了日/);
      fireEvent.change(endDateInput, { target: { value: "2026-06-30" } });

      // when
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/1",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"end_date":"2026-06-30"'),
          }),
        );
      });
    });
  });

  // AC4: 進捗率スライダーを変更して保存すると 0〜100 の値が PATCH で保存される
  describe("進捗率スライダー（AC4）", () => {
    it("TaskDetailPanel_進捗率スライダーを変更して保存したとき_progress フィールドと共に PATCH が呼ばれる", async () => {
      // given
      const updatedTask = makeTask({ id: 1, name: "サンプルタスク", progress: 50 });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedTask,
      });
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      const slider = screen.getByLabelText(/進捗率/);
      fireEvent.change(slider, { target: { value: "50" } });

      // when
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/1",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"progress":50'),
          }),
        );
      });
    });
  });

  // AC5: ステータスドロップダウンを変更して保存すると 未着手/進行中/完了/保留 のいずれかが PATCH で保存される
  describe("ステータス選択（AC5）", () => {
    it("TaskDetailPanel_ステータスを変更して保存したとき_status フィールドと共に PATCH が呼ばれる", async () => {
      // given
      const updatedTask = makeTask({ id: 1, name: "サンプルタスク", status: "進行中" });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => updatedTask,
      });
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );
      const statusSelect = screen.getByLabelText(/ステータス/);
      fireEvent.change(statusSelect, { target: { value: "進行中" } });

      // when
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/1",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"status":"進行中"'),
          }),
        );
      });
    });

    it("TaskDetailPanel_open が true のとき_ステータス選択肢に未着手・進行中・完了・保留の4つが存在する", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();

      // when
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // then
      expect(screen.getByRole("option", { name: "未着手" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "進行中" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "完了" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "保留" })).toBeInTheDocument();
    });
  });

  // AC6: パネル外をクリックまたは × ボタンでパネルを閉じる
  describe("パネルを閉じる（AC6）", () => {
    it("TaskDetailPanel_× ボタンをクリックしたとき_onClose が呼ばれる", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // when
      fireEvent.click(screen.getByRole("button", { name: /閉じる|×|close/i }));

      // then
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("TaskDetailPanel_キャンセルボタンをクリックしたとき_onClose が呼ばれる", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // when
      fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));

      // then
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
