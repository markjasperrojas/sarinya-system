import { render, screen, fireEvent } from "@testing-library/react";
import StatsCard from "../StatsCard";
import { ShoppingCart } from "lucide-react";

describe("StatsCard component", () => {
  const defaultProps = {
    title: "Total Sales",
    value: 1500,
    icon: ShoppingCart,
  };

  it("renders the title", () => {
    render(<StatsCard {...defaultProps} />);
    expect(screen.getByText("Total Sales")).toBeInTheDocument();
  });

  it("renders numeric value with toLocaleString formatting", () => {
    render(<StatsCard {...defaultProps} value={1000000} />);
    expect(screen.getByText("1,000,000")).toBeInTheDocument();
  });

  it("renders string values directly", () => {
    render(<StatsCard {...defaultProps} value="N/A" />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("renders prefix before the value", () => {
    render(<StatsCard {...defaultProps} prefix="₱" value={500} />);
    expect(screen.getByText(/₱/)).toBeInTheDocument();
  });

  it("renders suffix after the value", () => {
    render(<StatsCard {...defaultProps} suffix=" items" value={10} />);
    expect(screen.getByText(/ items/)).toBeInTheDocument();
  });

  it("renders trend up icon when trend='up'", () => {
    render(<StatsCard {...defaultProps} trend="up" trendValue="+12%" />);
    expect(screen.getByText("+12%")).toBeInTheDocument();
    // TrendingUp SVG should be present
    const { container } = render(<StatsCard {...defaultProps} trend="up" trendValue="+5%" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders trend down icon when trend='down'", () => {
    render(<StatsCard {...defaultProps} trend="down" trendValue="-5%" />);
    expect(screen.getByText("-5%")).toBeInTheDocument();
  });

  it("does not render trend section when trendValue is null", () => {
    render(<StatsCard {...defaultProps} trendValue={null} />);
    // trendValue null means no trend row rendered
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("calls onClick when card is clicked and onClick is provided", () => {
    const onClick = jest.fn();
    render(<StatsCard {...defaultProps} onClick={onClick} />);
    // The card is a div — find it by its role or by the title proximity
    const card = screen.getByText("Total Sales").closest("div[class*='card']") ||
      screen.getByText("Total Sales").parentElement.parentElement.parentElement;
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalled();
  });

  it("applies cursor-pointer when onClick is provided", () => {
    const { container } = render(<StatsCard {...defaultProps} onClick={jest.fn()} />);
    const outerDiv = container.firstChild;
    expect(outerDiv.className).toContain("cursor-pointer");
  });

  it("does not apply cursor-pointer when onClick is null", () => {
    const { container } = render(<StatsCard {...defaultProps} />);
    const outerDiv = container.firstChild;
    expect(outerDiv.className).not.toContain("cursor-pointer");
  });
});
