/**
 * Issue #15: WBS D&D のコンポーネントレベルテスト（AC1〜AC4）
 *
 * @dnd-kit/core / @dnd-kit/sortable を jest.mock でスタブ化し、
 * DndContext の onDragEnd コールバックをキャプチャしてテストから直接呼び出す。
 * over.data.current には本番コードと同じ { zone, taskId } を渡す。
 */
import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import type { Task } from "../../types/task";

// ---- @dnd-kit/core の virtual mock ----
// onDragEnd コールバックをキャプチャして tests から直接呼び出せるようにする
type DropZoneData = { zone: "before" | "after" | "child"; taskId: number };
let capturedOnDragEnd: ((event: { active: { id: number }; over: { id: number; data: { current: DropZoneData } } | null }) => void) | undefined;

jest.mock(
  "@dnd-kit/core",
  () => {
    const React = require("react");
    return {
      DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: typeof capturedOnDragEnd; [key: string]: unknown }) => {
        capturedOnDragEnd = onDragEnd;
        return React.createElement(React.Fragment, null, children);
      },
      DragOverlay: ({ children }: { children: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      useDraggable: () => ({
        attributes: { role: "button" },
        listeners: {},
        setNodeRef: jest.fn(),
        isDragging: false,
        transform: null,
      }),
      useDroppable: () => ({
        setNodeRef: jest.fn(),
        isOver: false,
        over: null,
      }),
      closestCenter: jest.fn(),
      PointerSensor: class {
        constructor() {}
      },
      useSensor: jest.fn(),
      useSensors: jest.fn(() => []),
    };
  },
);

jest.mock(
  "@dnd-kit/sortable",
  () => {
    const React = require("react");
    return {
      SortableContext: ({ children }: { children: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        isDragging: false,
        transform: null,
        transition: null,
      }),
      verticalListSortingStrategy: jest.fn(),
      arrayMove: (arr: unknown[], from: number, to: number) => {
        const next = [...arr];
        next.splice(to, 0, next.splice(from, 1)[0]);
        return next;
      },
    };
  },
);
// ---- virtual mock ここまで ----

import TaskTreeTable from "../../components/wbs/TaskTreeTable";

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

describe("TaskTreeTable - D&D（Issue #15）", () => {
  beforeEach(() => {
    capturedOnDragEnd = undefined;
    jest.clearAllMocks();
  });

  describe("AC4: API 保存失敗時のロールバック", () => {
    it("TaskTreeTable_ドロップ後API保存に失敗したとき_ドラッグ前の状態にロールバックされrole_alertが表示される", async () => {
      // given
      const tasks: Task[] = [
        makeTask({ id: 1, name: "タスクA", sort_order: 0 }),
        makeTask({ id: 2, name: "タスクB", sort_order: 1 }),
      ];
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

      render(<TaskTreeTable projectId={1} initialTasks={tasks} />);

      // 初期状態: A が B より前に表示されている
      const rowsBefore = screen.getAllByTestId("task-row");
      expect(rowsBefore[0]).toHaveTextContent("タスクA");
      expect(rowsBefore[1]).toHaveTextContent("タスクB");

      // when: タスクB を タスクA の「before」ゾーンにドロップ（A と B の順が入れ替わるはず）
      await act(async () => {
        capturedOnDragEnd?.({
          active: { id: 2 },
          over: { id: 1, data: { current: { zone: "before", taskId: 1 } } },
        });
      });

      // then: API 失敗 → PATCH /api/tasks/2/move が呼ばれた上でロールバックされる
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/2/move",
          expect.objectContaining({ method: "PATCH" }),
        );
      });

      // ロールバック後は元の順序に戻っている
      const rowsAfter = screen.getAllByTestId("task-row");
      expect(rowsAfter[0]).toHaveTextContent("タスクA");
      expect(rowsAfter[1]).toHaveTextContent("タスクB");

      // role=alert が表示されている
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("AC1: ドロップ後 sort_order が更新されて並び順が変わる", () => {
    it("TaskTreeTable_タスクをbeforeゾーンにドロップしたとき_APIを呼び並び順が更新される", async () => {
      // given
      const tasks: Task[] = [
        makeTask({ id: 1, name: "タスクA", sort_order: 0 }),
        makeTask({ id: 2, name: "タスクB", sort_order: 1 }),
      ];
      const movedTask = makeTask({ id: 2, name: "タスクB", sort_order: 0 });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => movedTask,
      });

      render(<TaskTreeTable projectId={1} initialTasks={tasks} />);

      // when: B を A の前にドロップ
      await act(async () => {
        capturedOnDragEnd?.({
          active: { id: 2 },
          over: { id: 1, data: { current: { zone: "before", taskId: 1 } } },
        });
      });

      // then: PATCH /api/tasks/2/move が呼ばれた
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/2/move",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"sort_order"'),
          }),
        );
      });

      // 楽観的更新で並び順が変わっている
      const rows = screen.getAllByTestId("task-row");
      expect(rows[0]).toHaveTextContent("タスクB");
      expect(rows[1]).toHaveTextContent("タスクA");
    });
  });

  describe("AC2: parent_id が更新されて子タスクになる", () => {
    it("TaskTreeTable_タスクをchildゾーンにドロップしたとき_parent_idを更新するAPIが呼ばれる", async () => {
      // given
      const tasks: Task[] = [
        makeTask({ id: 1, name: "タスクA", sort_order: 0 }),
        makeTask({ id: 2, name: "タスクB", sort_order: 1 }),
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => makeTask({ id: 2, name: "タスクB", parent_id: 1, sort_order: 0 }),
      });

      render(<TaskTreeTable projectId={1} initialTasks={tasks} />);

      // when: B を A の「child」ゾーンにドロップ
      await act(async () => {
        capturedOnDragEnd?.({
          active: { id: 2 },
          over: { id: 1, data: { current: { zone: "child", taskId: 1 } } },
        });
      });

      // then: parent_id を含む PATCH が呼ばれた
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/2/move",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"parent_id":1'),
          }),
        );
      });
    });
  });

  describe("AC3: parent_id が NULL になる", () => {
    it("TaskTreeTable_子タスクをルートタスクのafterゾーンにドロップしたとき_parent_idをnullにするAPIが呼ばれる", async () => {
      // given: Root(sort=0), Child(parent=Root, sort=0), Root2(sort=1)
      const tasks: Task[] = [
        makeTask({ id: 1, name: "ルート", parent_id: null, sort_order: 0 }),
        makeTask({ id: 2, name: "子タスク", parent_id: 1, sort_order: 0 }),
        makeTask({ id: 3, name: "ルート2", parent_id: null, sort_order: 1 }),
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => makeTask({ id: 2, name: "子タスク", parent_id: null, sort_order: 2 }),
      });

      render(<TaskTreeTable projectId={1} initialTasks={tasks} />);

      // when: 子タスクをルート2の「after」ゾーンにドロップ
      await act(async () => {
        capturedOnDragEnd?.({
          active: { id: 2 },
          over: { id: 3, data: { current: { zone: "after", taskId: 3 } } },
        });
      });

      // then: parent_id = null を含む PATCH が呼ばれた
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/tasks/2/move",
          expect.objectContaining({
            method: "PATCH",
            body: expect.stringContaining('"parent_id":null'),
          }),
        );
      });
    });
  });
});
