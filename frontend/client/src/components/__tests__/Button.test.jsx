import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";
import { Package } from "lucide-react";

describe("Button component", () => {
  it("renders children text", () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("shows loading spinner and 'Loading...' text when loading is true", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("is disabled when loading prop is true", () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when loading", () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when enabled and clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies w-full class when fullWidth is true", () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("renders icon on the left by default (SVG present in button)", () => {
    const { container } = render(<Button icon={Package}>Products</Button>);
    expect(container.querySelector("button svg")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("renders icon on the right when iconPosition is 'right' (SVG present in button)", () => {
    const { container } = render(<Button icon={Package} iconPosition="right">Products</Button>);
    expect(container.querySelector("button svg")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
  });
});
