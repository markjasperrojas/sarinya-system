const { requireRole } = require("../../middleware/permissionMiddleware");

function makeReqRes(user = null) {
  const req = { user };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("requireRole middleware", () => {
  it("returns 401 when req.user is absent", () => {
    const { req, res, next } = makeReqRes(null);
    requireRole("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user has wrong role", () => {
    const { req, res, next } = makeReqRes({ role: "staff" });
    requireRole("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied. Insufficient role." });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when user has the correct role", () => {
    const { req, res, next } = makeReqRes({ role: "admin" });
    requireRole("admin")(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("supports multiple allowed roles — grants when user matches one", () => {
    const { req, res, next } = makeReqRes({ role: "staff" });
    requireRole("admin", "staff")(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("supports multiple allowed roles — denies when user matches none", () => {
    const { req, res, next } = makeReqRes({ role: "staff" });
    requireRole("admin")(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
