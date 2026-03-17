import { render, screen, fireEvent } from "@testing-library/react";
import Input from "../Input";
import { User } from "lucide-react";

describe("Input component", () => {
  it("renders the label when provided", () => {
    render(<Input label="Username" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("shows required asterisk when required prop is set", () => {
    render(<Input label="Email" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show asterisk when not required", () => {
    render(<Input label="Email" />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders error message when error prop is provided", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("applies red border class when error is present", () => {
    const { container } = render(<Input error="Error!" />);
    const input = container.querySelector("input");
    expect(input.className).toContain("border-danger-500");
  });

  it("renders helperText when provided and no error", () => {
    render(<Input helperText="Enter your email address" />);
    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  it("shows error over helperText when both are provided", () => {
    render(<Input error="Required" helperText="Some hint" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.queryByText("Some hint")).not.toBeInTheDocument();
  });

  it("renders icon when icon prop is provided", () => {
    const { container } = render(<Input icon={User} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("passes standard HTML props through to the input element", () => {
    render(<Input type="password" placeholder="Enter password" data-testid="pw-input" />);
    const input = screen.getByTestId("pw-input");
    expect(input.type).toBe("password");
    expect(input.placeholder).toBe("Enter password");
  });

  it("fires onChange handler", () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} data-testid="my-input" />);
    fireEvent.change(screen.getByTestId("my-input"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
