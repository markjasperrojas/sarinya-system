const AppError = require("../../utils/AppError");

describe("AppError", () => {
  it("is an instance of Error", () => {
    const err = new AppError("Something failed", 400);
    expect(err).toBeInstanceOf(Error);
  });

  it("sets statusCode correctly", () => {
    const err = new AppError("Not found", 404);
    expect(err.statusCode).toBe(404);
  });

  it("sets isOperational to true", () => {
    const err = new AppError("Bad request", 400);
    expect(err.isOperational).toBe(true);
  });

  it("sets message correctly", () => {
    const err = new AppError("Unauthorized", 401);
    expect(err.message).toBe("Unauthorized");
  });

  it("works with 5xx codes", () => {
    const err = new AppError("Internal error", 500);
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });
});
