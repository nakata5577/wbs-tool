import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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

  // AC6（Issue）: × ボタン・キャンセルボタンでパネルを閉じる
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

  // Issue AC5（ESC キー）
  describe("ESC キーでパネルを閉じる（Issue AC5）", () => {
    it("TaskDetailPanel_パネルが開いているとき ESC キーを押す_onClose が呼ばれる", () => {
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
      fireEvent.keyDown(document, { key: "Escape" });

      // then
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("TaskDetailPanel_パネルが閉じているとき ESC キーを押す_onClose は呼ばれない", () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();
      render(
        <TaskDetailPanel
          task={sampleTask}
          open={false}
          onClose={onClose}
          onSave={onSave}
        />,
      );

      // when
      fireEvent.keyDown(document, { key: "Escape" });

      // then
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // Issue AC9（自動フォーカス）
  describe("パネルが開くと担当者フィールドに自動フォーカスする（Issue AC9）", () => {
    it("TaskDetailPanel_open が true でレンダーしたとき_担当者入力フィールドにフォーカスが当たる", async () => {
      // given
      const onClose = jest.fn();
      const onSave = jest.fn();

      // when
      await act(async () => {
        render(
          <TaskDetailPanel
            task={sampleTask}
            open={true}
            onClose={onClose}
            onSave={onSave}
          />,
        );
      });

      // then
      const assigneeInput = screen.getByLabelText(/担当者/);
      expect(document.activeElement).toBe(assigneeInput);
    });
  });

  // Issue AC8（フォーカストラップ）
  describe("Tab キーでフォーカスがパネル内に留まる（Issue AC8）", () => {
    it("TaskDetailPanel_最後のフォーカス対象で Tab を押したとき_先頭要素にフォーカスが戻る", () => {
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
      // パネル内フォーカス可能要素を取得
      const panel = screen.getByRole("dialog");
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled])",
        ),
      );
      const lastElement = focusable[focusable.length - 1];
      const firstElement = focusable[0];

      // when: 最後の要素にフォーカスを当ててから Tab を押す
      lastElement.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: false });

      // then: フォーカスが先頭要素に戻る
      expect(document.activeElement).toBe(firstElement);
    });

    it("TaskDetailPanel_先頭のフォーカス対象で Shift+Tab を押したとき_末尾要素にフォーカスが移る", () => {
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
      const panel = screen.getByRole("dialog");
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled])",
        ),
      );
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      // when: 先頭要素にフォーカスを当ててから Shift+Tab を押す
      firstElement.focus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

      // then: フォーカスが末尾要素に移る
      expect(document.activeElement).toBe(lastElement);
    });
  });

  // ネットワークエラーハンドリング
  describe("ネットワークエラー時のエラー表示", () => {
    it("TaskDetailPanel_fetch が例外を投げたとき_role=alert のエラーメッセージが表示される", async () => {
      // given
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
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
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("保存に失敗しました");
      });
    });

    it("TaskDetailPanel_API が 500 を返したとき_role=alert のエラーメッセージが表示される", async () => {
      // given
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
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
      fireEvent.click(screen.getByRole("button", { name: /保存/ }));

      // then
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("保存に失敗しました");
      });
    });
  });
});
