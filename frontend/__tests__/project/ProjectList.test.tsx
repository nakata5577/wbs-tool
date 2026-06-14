import { render, screen, fireEvent } from "@testing-library/react";
import ProjectList from "../../components/project/ProjectList";

interface Project {
  id: number;
  name: string;
  description: string | null;
  is_deleted: boolean;
}

const sampleProjects: Project[] = [
  { id: 1, name: "Alpha プロジェクト", description: "説明A", is_deleted: false },
  { id: 2, name: "Beta タスク", description: null, is_deleted: false },
];

describe("ProjectList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("プロジェクト一覧の表示", () => {
    it("ProjectList_プロジェクトが2件あるとき_各プロジェクト名が表示される", () => {
      // given
      const projects = sampleProjects;

      // when
      render(<ProjectList initialProjects={projects} />);

      // then
      expect(screen.getByText("Alpha プロジェクト")).toBeInTheDocument();
      expect(screen.getByText("Beta タスク")).toBeInTheDocument();
    });
  });

  describe("空状態", () => {
    it("ProjectList_プロジェクトが0件のとき_空状態プレースホルダが表示される", () => {
      // given
      const projects: Project[] = [];

      // when
      render(<ProjectList initialProjects={projects} />);

      // then
      expect(screen.getByText("プロジェクトがありません")).toBeInTheDocument();
    });
  });

  describe("検索フィルタリング", () => {
    it("ProjectList_検索欄に文字を入力したとき_一致するプロジェクトのみ表示される", () => {
      // given
      render(<ProjectList initialProjects={sampleProjects} />);
      const searchInput = screen.getByRole("searchbox");

      // when
      fireEvent.change(searchInput, { target: { value: "Alpha" } });

      // then
      expect(screen.getByText("Alpha プロジェクト")).toBeInTheDocument();
      expect(screen.queryByText("Beta タスク")).not.toBeInTheDocument();
    });
  });
});
