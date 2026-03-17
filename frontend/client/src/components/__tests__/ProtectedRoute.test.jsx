import { render, screen } from "@testing-library/react";
import AuthContext from "../../contexts/AuthContext";

// Mock react-router-dom — CRA 5's Jest (v27) can't resolve react-router-dom v7's package exports field.
// We test ProtectedRoute in isolation, so simple mocks of Navigate and useLocation are sufficient.
jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  useLocation: () => ({ pathname: "/protected", search: "" }),
}));

// Import AFTER the mock is set up
const ProtectedRoute = require("../ProtectedRoute").default;

function makeAuth(overrides = {}) {
  return {
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
    isAdmin: () => overrides.user?.role === "admin",
    isStaff: () => overrides.user?.role === "staff",
    isAuthenticated: () => !!overrides.user,
    ...overrides,
  };
}

function renderRoute(authValue, routeProps = {}) {
  return render(
    <AuthContext.Provider value={makeAuth(authValue)}>
      <ProtectedRoute {...routeProps}>
        <div data-testid="content">Protected Content</div>
      </ProtectedRoute>
    </AuthContext.Provider>
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner while auth is loading", () => {
    renderRoute({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to default '/'", () => {
    renderRoute({ user: null, loading: false });
    const nav = screen.getByTestId("navigate");
    expect(nav).toHaveAttribute("data-to", "/");
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to custom redirectTo path", () => {
    renderRoute({ user: null, loading: false }, { redirectTo: "/login" });
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/login");
  });

  it("renders children for authenticated user with no role requirement", () => {
    renderRoute({ user: { username: "alice", role: "staff" }, loading: false });
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("renders children when user role matches single required role", () => {
    renderRoute(
      { user: { username: "admin", role: "admin" }, loading: false },
      { requiredRole: "admin" }
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders children when user role matches one in a required role array", () => {
    renderRoute(
      { user: { username: "alice", role: "staff" }, loading: false },
      { requiredRole: ["admin", "staff"] }
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("redirects to /dashboard when user role does not match required role", () => {
    renderRoute(
      { user: { username: "alice", role: "staff" }, loading: false },
      { requiredRole: "admin" }
    );
    expect(screen.getByTestId("navigate")).toHaveAttribute("data-to", "/dashboard");
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });
});
