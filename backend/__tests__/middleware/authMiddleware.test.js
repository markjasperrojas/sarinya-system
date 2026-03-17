const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../setup/appSetup");
const { createUserAndToken } = require("../setup/helpers");

jest.mock("../../utils/activityLogger");

const JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-testing-only";

// Use GET /api/users (admin-only) to verify auth middleware rejects before role check
// Use POST /api/auth/logout (any authenticated user) to verify valid token passes

describe("authMiddleware", () => {
  it("returns 401 when no Authorization header is provided", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/no token/i);
  });

  it("returns 401 for a malformed / invalid JWT", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", "Bearer thisisnotavalidtoken");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
  });

  it("returns 401 for a JWT signed with the wrong secret", async () => {
    const badToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, "wrong-secret", { expiresIn: "1d" });
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the user ID in the token does not exist in the DB", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: fakeId }, JWT_SECRET, { expiresIn: "1d" });
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("User not found");
  });

  it("returns 403 when the user account is inactive", async () => {
    const { token } = await createUserAndToken({ role: "staff", isActive: false });
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/deactivated/i);
  });

  it("calls next and populates req.user for a valid token", async () => {
    const { token } = await createUserAndToken({ role: "staff" });
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    // Logout returns 200, confirming middleware passed
    expect(res.status).toBe(200);
  });
});
