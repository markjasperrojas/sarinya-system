import { render, screen, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";
import { setAuthToken } from "../../api";

// Mock the API module to avoid real HTTP calls
jest.mock("../../api", () => {
  const mockAPI = {
    post: jest.fn().mockResolvedValue({ data: {} }),
    defaults: { headers: { common: {} } },
  };
  return {
    __esModule: true,
    default: mockAPI,
    setAuthToken: jest.fn(),
  };
});

function AuthConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.username : "null"}</span>
      <span data-testid="loading">{auth.loading ? "loading" : "done"}</span>
      <span data-testid="isAuthenticated">{auth.isAuthenticated() ? "yes" : "no"}</span>
      <span data-testid="isAdmin">{auth.isAdmin() ? "yes" : "no"}</span>
      <span data-testid="isStaff">{auth.isStaff() ? "yes" : "no"}</span>
    </div>
  );
}

function LoginButton() {
  const { login } = useAuth();
  return (
    <button onClick={() => login({ username: "alice", role: "admin" }, "tok123")}>
      Login
    </button>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Logout</button>;
}

function UpdateButton() {
  const { updateUser } = useAuth();
  return (
    <button onClick={() => updateUser({ username: "alice-updated", role: "admin" })}>
      Update
    </button>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow("useAuth must be used within an AuthProvider");
    spy.mockRestore();
  });

  it("initial state: user is null and loading becomes false", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("done"));
    expect(screen.getByTestId("user").textContent).toBe("null");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("no");
  });

  it("restores user from localStorage on mount", async () => {
    localStorage.setItem("sarinya_token", "stored-token");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "alice", role: "staff" }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("alice"));
    expect(setAuthToken).toHaveBeenCalledWith("stored-token");
  });

  it("clears corrupt localStorage data gracefully", async () => {
    localStorage.setItem("sarinya_token", "some-token");
    localStorage.setItem("sarinya_user", "{{{not valid json");

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("done"));
    expect(localStorage.getItem("sarinya_token")).toBeNull();
    expect(localStorage.getItem("sarinya_user")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("login() sets localStorage, calls setAuthToken, and updates user state", async () => {
    const { getByRole } = render(
      <AuthProvider>
        <AuthConsumer />
        <LoginButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("done"));

    await act(async () => {
      getByRole("button", { name: /login/i }).click();
    });

    expect(localStorage.getItem("sarinya_token")).toBe("tok123");
    expect(JSON.parse(localStorage.getItem("sarinya_user")).username).toBe("alice");
    expect(setAuthToken).toHaveBeenCalledWith("tok123");
    expect(screen.getByTestId("user").textContent).toBe("alice");
  });

  it("logout() clears localStorage and calls setAuthToken(null)", async () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "alice", role: "staff" }));

    const { getByRole } = render(
      <AuthProvider>
        <AuthConsumer />
        <LogoutButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("alice"));

    await act(async () => {
      getByRole("button", { name: /logout/i }).click();
    });

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("null"));
    expect(localStorage.getItem("sarinya_token")).toBeNull();
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });

  it("isAdmin() returns true for admin users", async () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "admin", role: "admin" }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("isAdmin").textContent).toBe("yes"));
    expect(screen.getByTestId("isStaff").textContent).toBe("no");
  });

  it("isStaff() returns true for staff users", async () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "bob", role: "staff" }));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("isStaff").textContent).toBe("yes"));
    expect(screen.getByTestId("isAdmin").textContent).toBe("no");
  });

  it("updateUser() persists new user data to localStorage and state", async () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "alice", role: "admin" }));

    const { getByRole } = render(
      <AuthProvider>
        <AuthConsumer />
        <UpdateButton />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("user").textContent).toBe("alice"));

    await act(async () => {
      getByRole("button", { name: /update/i }).click();
    });

    expect(screen.getByTestId("user").textContent).toBe("alice-updated");
    expect(JSON.parse(localStorage.getItem("sarinya_user")).username).toBe("alice-updated");
  });
});
