const request = require("supertest");
const app = require("../setup/appSetup");
const { createUserAndToken } = require("../setup/helpers");
const ActivityLog = require("../../models/ActivityLog");

jest.mock("../../utils/activityLogger");

describe("GET /api/activity-logs", () => {
  let adminToken, adminUser;

  beforeEach(async () => {
    ({ user: adminUser, token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 403 for staff users (admin-only)", async () => {
    const { token: staffToken } = await createUserAndToken({ role: "staff" });
    const res = await request(app)
      .get("/api/activity-logs")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/activity-logs");
    expect(res.status).toBe(401);
  });

  it("returns logs with pagination for admin", async () => {
    await ActivityLog.create({
      userId: adminUser._id,
      action: "login",
      module: "auth",
      description: "Admin logged in",
    });

    const res = await request(app)
      .get("/api/activity-logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.logs).toBeDefined();
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it("populates userId with username", async () => {
    await ActivityLog.create({
      userId: adminUser._id,
      action: "edit",
      module: "users",
      description: "Updated a user",
    });

    const res = await request(app)
      .get("/api/activity-logs")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const log = res.body.logs.find((l) => l.action === "edit");
    expect(log.userId).toHaveProperty("username");
  });
});
