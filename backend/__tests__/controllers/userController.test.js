const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../setup/appSetup");
const { createUserAndToken } = require("../setup/helpers");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

jest.mock("../../utils/activityLogger");

describe("POST /api/users (createUser)", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 400 when username already exists", async () => {
    await createUserAndToken({ username: "duplicateuser" });

    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "duplicateuser", password: "pass123", role: "staff" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("creates user successfully and excludes password from response", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ username: "newstaff", password: "pass123", role: "staff" });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe("newstaff");
    expect(res.body.password).toBeUndefined();
    expect(res.body.role).toBe("staff");
  });
});

describe("DELETE /api/users/:id (deleteUser)", () => {
  let adminUser, adminToken;

  beforeEach(async () => {
    ({ user: adminUser, token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns 400 when trying to delete own account", async () => {
    const res = await request(app)
      .delete(`/api/users/${adminUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/own account/i);
  });

  it("soft-deletes another user successfully", async () => {
    const { user: otherUser } = await createUserAndToken({ username: "tobedeleted" });

    const res = await request(app)
      .delete(`/api/users/${otherUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await User.findById(otherUser._id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.isActive).toBe(false);
  });
});

describe("PUT /api/users/:id (updateUser)", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("hashes new password when updated", async () => {
    const { user } = await createUserAndToken({ username: "pwupdateuser" });

    await request(app)
      .put(`/api/users/${user._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "newSecurePassword" });

    const updated = await User.findById(user._id);
    const isHashed = await bcrypt.compare("newSecurePassword", updated.password);
    expect(isHashed).toBe(true);
    // Ensure plain text is not stored
    expect(updated.password).not.toBe("newSecurePassword");
  });
});

describe("GET /api/users (getUsers)", () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await createUserAndToken({ role: "admin" }));
  });

  it("returns users without password field, excludes soft-deleted", async () => {
    await createUserAndToken({ username: "activeuser" });
    const { user: deletedUser } = await createUserAndToken({ username: "deleteduser" });
    await User.findByIdAndUpdate(deletedUser._id, { deletedAt: new Date() });

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const usernames = res.body.map((u) => u.username);
    expect(usernames).toContain("activeuser");
    expect(usernames).not.toContain("deleteduser");
    res.body.forEach((u) => expect(u.password).toBeUndefined());
  });
});
