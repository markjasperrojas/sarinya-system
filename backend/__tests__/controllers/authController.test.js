const request = require("supertest");
const app = require("../setup/appSetup");
const { createUserAndToken } = require("../setup/helpers");

jest.mock("../../utils/activityLogger");

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await createUserAndToken({ username: "logintest", role: "staff" });
    await createUserAndToken({ username: "inactivetest", role: "staff", isActive: false });
  });

  it("returns 400 when username does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "doesnotexist", password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User not found");
  });

  it("returns 403 when user account is inactive", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "inactivetest", password: "password123" });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/deactivated/i);
  });

  it("returns 400 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "logintest", password: "wrongpassword" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Wrong password");
  });

  it("returns 200 with token and user (no password field) on success", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "logintest", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe("logintest");
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.role).toBeDefined();
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });

  it("returns 200 with a valid token", async () => {
    const { token } = await createUserAndToken({ username: "logouttest" });
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/logged out/i);
  });
});
