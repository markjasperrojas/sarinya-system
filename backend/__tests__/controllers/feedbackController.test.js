const request = require("supertest");
const app = require("../setup/appSetup");
const { createUserAndToken } = require("../setup/helpers");

jest.mock("../../utils/activityLogger");

describe("POST /api/feedback", () => {
  let staffToken;

  beforeEach(async () => {
    ({ token: staffToken } = await createUserAndToken({ role: "staff" }));
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .send({ message: "Great system!" });
    expect(res.status).toBe(401);
  });

  it("returns 400 when message is missing", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ type: "bug" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/message/i);
  });

  it("creates feedback with default type 'other' when type not provided", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ message: "This is feedback" });
    expect(res.status).toBe(201);
    expect(res.body.feedback.type).toBe("other");
  });

  it("uses first 60 chars of message as title when title not provided", async () => {
    const msg = "Short feedback";
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ message: msg });
    expect(res.status).toBe(201);
    expect(res.body.feedback.title).toBe(msg);
  });

  it("creates feedback successfully with all fields", async () => {
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ type: "feature_request", title: "Add dark mode", message: "Please add dark mode", page: "/dashboard" });
    expect(res.status).toBe(201);
    expect(res.body.feedback.type).toBe("feature_request");
    expect(res.body.feedback.page).toBe("/dashboard");
  });
});

describe("GET /api/feedback", () => {
  it("returns 403 for staff (admin-only)", async () => {
    const { token: staffToken } = await createUserAndToken({ role: "staff" });
    const res = await request(app)
      .get("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
  });

  it("returns feedback list for admin", async () => {
    const { token: adminToken } = await createUserAndToken({ role: "admin" });
    const { token: staffToken } = await createUserAndToken({ role: "staff" });

    await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ message: "Test feedback" });

    const res = await request(app)
      .get("/api/feedback")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
