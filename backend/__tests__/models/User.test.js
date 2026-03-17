const User = require("../../models/User");

describe("User model", () => {
  it("defaults role to 'staff'", () => {
    const user = new User({ username: "test", password: "hashed" });
    expect(user.role).toBe("staff");
  });

  it("defaults isActive to true", () => {
    const user = new User({ username: "test", password: "hashed" });
    expect(user.isActive).toBe(true);
  });

  it("defaults deletedAt to null", () => {
    const user = new User({ username: "test", password: "hashed" });
    expect(user.deletedAt).toBeNull();
  });

  it("accepts 'admin' role", () => {
    const user = new User({ username: "admin", password: "hashed", role: "admin" });
    expect(user.role).toBe("admin");
  });

  it("rejects invalid role values", async () => {
    const user = new User({ username: "test", password: "hashed", role: "superuser" });
    await expect(user.validate()).rejects.toThrow();
  });

  it("requires username", async () => {
    const user = new User({ password: "hashed" });
    await expect(user.validate()).rejects.toThrow();
  });

  it("requires password", async () => {
    const user = new User({ username: "test" });
    await expect(user.validate()).rejects.toThrow();
  });
});
