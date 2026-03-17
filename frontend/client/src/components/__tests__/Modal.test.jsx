import { render, screen, fireEvent, act } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal component", () => {
  it("renders nothing when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByText("Test")).not.toBeInTheDocument();
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders title and children when isOpen is true", async () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="My Modal">
        <p>Modal body</p>
      </Modal>
    );
    // Modal uses requestAnimationFrame for animation — flush it
    await act(async () => {});
    expect(screen.getByText("My Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal body")).toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Closeable">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Backdrop Test">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    // The backdrop is the outer fixed div
    const backdrop = container.firstChild;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Escape Test">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("sets body overflow to hidden when open", async () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Overflow Test">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow when closed", async () => {
    const { rerender } = render(
      <Modal isOpen onClose={jest.fn()} title="Overflow Test">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal isOpen={false} onClose={jest.fn()} title="Overflow Test">
        <p>Content</p>
      </Modal>
    );
    await act(async () => {});
    expect(document.body.style.overflow).toBe("unset");
  });
});
