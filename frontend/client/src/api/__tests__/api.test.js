import API, { setAuthToken } from "../../api";

// The interceptor rejection handler is registered when the module loads.
// We extract it directly from the axios instance to test it without network calls.
function getInterceptorRejected() {
  // axios stores interceptors in handlers array: [{fulfilled, rejected}, ...]
  const handlers = API.interceptors.response.handlers;
  if (!handlers || handlers.length === 0) return null;
  // Find the handler added by our api.js
  return handlers[handlers.length - 1]?.rejected || null;
}

beforeEach(() => {
  localStorage.clear();
  delete API.defaults.headers.common["Authorization"];

  delete window.location;
  window.location = { href: "", pathname: "/dashboard", search: "" };
});

describe("setAuthToken", () => {
  it("sets Authorization header when token is provided", () => {
    setAuthToken("mytoken123");
    expect(API.defaults.headers.common["Authorization"]).toBe("Bearer mytoken123");
  });

  it("removes Authorization header when token is null", () => {
    API.defaults.headers.common["Authorization"] = "Bearer oldtoken";
    setAuthToken(null);
    expect(API.defaults.headers.common["Authorization"]).toBeUndefined();
  });
});

describe("401 interceptor", () => {
  it("clears localStorage and removes auth header on non-login 401", async () => {
    localStorage.setItem("sarinya_token", "tok");
    localStorage.setItem("sarinya_user", JSON.stringify({ username: "u" }));
    API.defaults.headers.common["Authorization"] = "Bearer tok";

    const rejected = getInterceptorRejected();
    const error = { config: { url: "/users" }, response: { status: 401 } };

    await expect(rejected(error)).rejects.toEqual(error);

    expect(localStorage.getItem("sarinya_token")).toBeNull();
    expect(localStorage.getItem("sarinya_user")).toBeNull();
    expect(API.defaults.headers.common["Authorization"]).toBeUndefined();
  });

  it("redirects to /?redirect=<path> when not on root on non-login 401", async () => {
    window.location.pathname = "/dashboard";
    window.location.search = "";

    const rejected = getInterceptorRejected();
    const error = { config: { url: "/inventory" }, response: { status: 401 } };

    await expect(rejected(error)).rejects.toEqual(error);

    expect(window.location.href).toBe(`/?redirect=${encodeURIComponent("/dashboard")}`);
  });

  it("does NOT redirect when already on root path", async () => {
    window.location.pathname = "/";
    window.location.search = "";

    const rejected = getInterceptorRejected();
    const error = { config: { url: "/inventory" }, response: { status: 401 } };

    await expect(rejected(error)).rejects.toEqual(error);

    expect(window.location.href).toBe(""); // no redirect
  });

  it("does NOT clear auth or redirect on 401 from the login endpoint", async () => {
    localStorage.setItem("sarinya_token", "tok");

    const rejected = getInterceptorRejected();
    const error = { config: { url: "/auth/login" }, response: { status: 401 } };

    await expect(rejected(error)).rejects.toEqual(error);

    // Nothing should be cleared for login 401s
    expect(localStorage.getItem("sarinya_token")).toBe("tok");
    expect(window.location.href).toBe("");
  });

  it("passes through non-401 errors without side effects", async () => {
    localStorage.setItem("sarinya_token", "tok");

    const rejected = getInterceptorRejected();
    const error = { config: { url: "/users" }, response: { status: 500 } };

    await expect(rejected(error)).rejects.toEqual(error);

    expect(localStorage.getItem("sarinya_token")).toBe("tok"); // not cleared
    expect(window.location.href).toBe("");
  });
});
