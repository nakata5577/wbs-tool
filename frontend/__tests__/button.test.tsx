import { render, screen } from "@testing-library/react";
import { Button } from "../components/ui/button";

describe("Button", () => {
  it("renders with label text", () => {
    render(<Button>ラベル</Button>);
    expect(screen.getByRole("button", { name: "ラベル" })).toBeInTheDocument();
  });
});
