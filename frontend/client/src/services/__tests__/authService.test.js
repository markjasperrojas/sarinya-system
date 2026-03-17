import { login, logout, getStoredUser } from "../authService";
import API, { setAuthToken } from "../../api";

jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: { response: { use: jest.fn() }, request: { use: jest.fn() } },
  },
  setAuthToken: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("authService.login", () => {
  it("stores token and user in localStorage on success", async () => {
    API.post.mockResolvedValue({
      data: { token: "jwt123", user: { username: "alice", role: "admin" } },
    });
    await login("alice", "password");
    expect(localStorage.getItem("sarinya_token")).toBe("jwt123");
    expect(JSON.parse(localStorage.getItem("sarinya_user")).username).toBe("alice");
  });

  it("calls setAuthToken with the returned token", async () => {
    API.post.mockResolvedValue({ data: { token: "tok", user: { username: "alice" } } });
    await login("alice", "password");
    expect(setAuthToken).toHaveBeenCalledWith("tok");
  });

  it("returns response data", async () => {
    const fakeData = { token: "tok", user: { username: "alice" } };
    API.post.mockResolvedValue({ data: fakeData });
    const result = await login("alice", "password");
    expect(result).toEqual(fakeData);
  });

  it("calls POST /auth/login with correct credentials", async () => {
    API.post.mockResolvedValue({ data: { token: "t", user: {} } });
    await login("alice", "secret");
    expect(API.post).toHaveBeenCalledWith("/auth/login", { username: "alice", password: "secret" });
  });

  it("propagates error on failed login", async () => {
    API.post.mockRejectedValue(new Error("Network error"));
    await expect(login("alice", "wrong")).rejects.toThrow("Network error");
  });
});

describe("authService.logout", () => {
  it("removes token and user from localStorage", () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "alice" }));
    logout();
    expect(localStorage.getItem("sarinya_token")).toBeNull();
    expect(localStorage.getItem("sarinya_user")).toBeNull();
  });

  it("calls setAuthToken(null)", () => {
    logout();
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });
});

describe("authService.getStoredUser", () => {
  it("returns null when localStorage is empty", () => {
    expect(getStoredUser()).toBeNull();
  });

  it("returns parsed user object when valid JSON is stored", () => {
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "alice", role: "staff" }));
    expect(getStoredUser()).toEqual({ username: "alice", role: "staff" });
  });

  it("returns null when stored JSON is corrupt", () => {
    localStorage.setItem("sarinya_user", "{invalid json{{{");
    expect(getStoredUser()).toBeNull();
  });
});
