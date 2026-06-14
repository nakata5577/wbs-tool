import { buildTree, flattenVisible } from "../../lib/taskTree";
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

describe("buildTree", () => {
  it("buildTree_空配列のとき_空配列を返す", () => {
    // given
    const tasks: Task[] = [];

    // when
    const result = buildTree(tasks);

    // then
    expect(result).toEqual([]);
  });

  it("buildTree_ルートタスクのみのとき_depth0のノード配列を返す", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "タスクA", sort_order: 0 }),
      makeTask({ id: 2, name: "タスクB", sort_order: 1 }),
    ];

    // when
    const result = buildTree(tasks);

    // then
    expect(result).toHaveLength(2);
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(0);
  });

  it("buildTree_親子タスクがあるとき_children配列に子タスクが含まれる", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "親タスク", parent_id: null, sort_order: 0 }),
      makeTask({ id: 2, name: "子タスク", parent_id: 1, sort_order: 0 }),
    ];

    // when
    const result = buildTree(tasks);

    // then
    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].task.id).toBe(2);
  });

  it("buildTree_sort_order昇順に並ぶ", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "後", sort_order: 10 }),
      makeTask({ id: 2, name: "前", sort_order: 1 }),
      makeTask({ id: 3, name: "中", sort_order: 5 }),
    ];

    // when
    const result = buildTree(tasks);

    // then
    expect(result[0].task.id).toBe(2);
    expect(result[1].task.id).toBe(3);
    expect(result[2].task.id).toBe(1);
  });
});

describe("flattenVisible", () => {
  it("flattenVisible_全展開のとき_全行を返す", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "親", parent_id: null, sort_order: 0 }),
      makeTask({ id: 2, name: "子", parent_id: 1, sort_order: 0 }),
    ];
    const tree = buildTree(tasks);
    const collapsedIds = new Set<number>();

    // when
    const result = flattenVisible(tree, collapsedIds);

    // then
    expect(result).toHaveLength(2);
  });

  it("flattenVisible_折りたたみIDがあるとき_その子孫行をスキップする", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "親", parent_id: null, sort_order: 0 }),
      makeTask({ id: 2, name: "子", parent_id: 1, sort_order: 0 }),
      makeTask({ id: 3, name: "孫", parent_id: 2, sort_order: 0 }),
    ];
    const tree = buildTree(tasks);
    const collapsedIds = new Set<number>([1]);

    // when
    const result = flattenVisible(tree, collapsedIds);

    // then
    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe(1);
  });

  it("flattenVisible_depthが正しく付与される", () => {
    // given
    const tasks: Task[] = [
      makeTask({ id: 1, name: "親", parent_id: null, sort_order: 0 }),
      makeTask({ id: 2, name: "子", parent_id: 1, sort_order: 0 }),
      makeTask({ id: 3, name: "孫", parent_id: 2, sort_order: 0 }),
    ];
    const tree = buildTree(tasks);
    const collapsedIds = new Set<number>();

    // when
    const result = flattenVisible(tree, collapsedIds);

    // then
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(1);
    expect(result[2].depth).toBe(2);
  });
});
