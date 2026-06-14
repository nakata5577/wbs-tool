import { render, screen, fireEvent } from "@testing-library/react";
import CreateProjectModal from "../../components/project/CreateProjectModal";
import type { Project } from "../../types/project";

describe("CreateProjectModal", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("モーダルの表示", () => {
    it("CreateProjectModal_open=trueのとき_モーダルタイトルまたはフォームが表示される", () => {
      // given / when
      render(
        <CreateProjectModal open={true} onClose={onClose} onSuccess={onSuccess} />
      );

      // then
      expect(screen.getByText("新規プロジェクト作成")).toBeInTheDocument();
    });
  });

  describe("バリデーション", () => {
    it("CreateProjectModal_名前が空で作成ボタンをクリックしたとき_role=alertでエラーが表示される", () => {
      // given
      render(
        <CreateProjectModal open={true} onClose={onClose} onSuccess={onSuccess} />
      );
      const submitButton = screen.getByRole("button", { name: /作成/ });

      // when
      fireEvent.click(submitButton);

      // then
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("作成フロー", () => {
    it("CreateProjectModal_名前を入力して作成ボタンをクリックしたとき_fetchがPOSTで呼ばれる", async () => {
      // given
      const mockProject: Project = {
        id: 1,
        name: "新プロジェクト",
        description: null,
        is_deleted: false,
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProject,
      });

      render(
        <CreateProjectModal open={true} onClose={onClose} onSuccess={onSuccess} />
      );
      const nameInput = screen.getByLabelText(/プロジェクト名/);

      // when
      fireEvent.change(nameInput, { target: { value: "新プロジェクト" } });
      const submitButton = screen.getByRole("button", { name: /作成/ });
      fireEvent.click(submitButton);

      // then
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
