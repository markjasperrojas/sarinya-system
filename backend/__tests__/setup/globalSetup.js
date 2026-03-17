const { MongoMemoryReplSet } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");
const os = require("os");

const MONGO_URI_FILE = path.join(os.tmpdir(), "sarinya_test_mongo.txt");

module.exports = async () => {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();

  // Store instance for globalTeardown (same process)
  global.__MONGO_REPLSET__ = replSet;

  // Write URI to temp file for test workers to read
  fs.writeFileSync(MONGO_URI_FILE, uri, "utf8");

  // Also attempt to set via process.env (may or may not propagate)
  process.env.MONGO_URI_TEST = uri;
  process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
};
