module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  maxWorkers: 1, // run sequentially — all tests share one in-memory MongoDB
  globalSetup: "./__tests__/setup/globalSetup.js",
  globalTeardown: "./__tests__/setup/globalTeardown.js",
  setupFilesAfterEnv: ["./__tests__/setup/jest.setup.js"],
  testTimeout: 30000,
  clearMocks: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "utils/**/*.js",
  ],
  coverageReporters: ["text", "lcov"],
};
