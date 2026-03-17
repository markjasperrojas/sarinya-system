const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const os = require("os");

const MONGO_URI_FILE = path.join(os.tmpdir(), "sarinya_test_mongo.txt");

beforeAll(async () => {
  // Ensure JWT_SECRET is available in this worker process
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
  }

  // Get URI: prefer env var (may be inherited), fall back to temp file
  let uri = process.env.MONGO_URI_TEST;
  if (!uri && fs.existsSync(MONGO_URI_FILE)) {
    uri = fs.readFileSync(MONGO_URI_FILE, "utf8").trim();
  }
  if (!uri) {
    throw new Error("No MongoDB URI found. Ensure globalSetup ran successfully.");
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
