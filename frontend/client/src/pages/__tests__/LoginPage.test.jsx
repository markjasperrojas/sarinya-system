import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AuthContext from "../../contexts/AuthContext";
import LoginPage from "../LoginPage";
import API from "../../api";

// Mock react-router-dom — CRA 5's Jest (v27) can't resolve react-router-dom v7's package exports field.
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() }, request: { use: jest.fn() } },
  },
  setAuthToken: jest.fn(),
}));

// Import mocks after jest.mock() calls
const { useNavigate, useLocation } = require("react-router-dom");

function makeAuth(overrides = {}) {
  return {
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: () => !!overrides.user,
    isAdmin: () => overrides.user?.role === "admin",
    isStaff: () => overrides.user?.role === "staff",
    ...overrides,
  };
}

function renderLoginPage(authOverrides = {}) {
  return render(
    <AuthContext.Provider value={makeAuth(authOverrides)}>
      <LoginPage />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useNavigate.mockReturnValue(jest.fn());
  useLocation.mockReturnValue({ pathname: "/", state: null, search: "" });
});

describe("LoginPage", () => {
  it("renders username and password fields with submit button", () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("already-logged-in user is redirected to /dashboard", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    renderLoginPage({ user: { username: "alice", role: "admin" } });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("redirects to ?redirect path when location.search contains redirect param", async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ pathname: "/", state: null, search: "?redirect=%2Finventory" });

    renderLoginPage({ user: { username: "alice", role: "staff" } });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/inventory", { replace: true });
    });
  });

  it("shows an error message on 400 response", async () => {
    const err = { response: { data: { error: "Wrong password" } } };
    API.post.mockRejectedValue(err);

    renderLoginPage();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "alice" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrongpass" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Wrong password")).toBeInTheDocument();
    });
  });

  it("calls auth.login and navigates on successful login", async () => {
    const loginFn = jest.fn();
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    API.post.mockResolvedValue({
      data: { token: "tok123", user: { username: "alice", role: "staff" } },
    });

    renderLoginPage({ login: loginFn });
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "alice" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "password" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    expect(loginFn).toHaveBeenCalledWith(
      { username: "alice", role: "staff" },
      "tok123"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  it("shows loading state while submit is in progress", async () => {
    API.post.mockImplementation(() => new Promise(() => {})); // never resolves

    renderLoginPage();
    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "alice" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "pass" } });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  it("shows generic error message when error field is absent", async () => {
    API.post.mockRejectedValue(new Error("Network error"));
    renderLoginPage();

    fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: "u" } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "p" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });
});
