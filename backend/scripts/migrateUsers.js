require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const User = require("../models/User");

const migrateUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Get all users
    const users = await User.find();

    if (users.length === 0) {
      console.log("No users found to migrate.");
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s) to migrate.`);

    let firstUser = true;

    for (const user of users) {
      // Skip if user already has role field set
      if (user.role && user.permissions) {
        console.log(`User "${user.username}" already migrated, skipping...`);
        continue;
      }

      if (firstUser) {
        // First user becomes admin
        user.role = "admin";
        user.permissions = {
          inventory: { view: true, add: true, edit: true, delete: true },
          sales: { view: true, add: true, edit: true, delete: true },
          users: { view: true, add: true, edit: true, delete: true },
        };
        user.isActive = true;
        console.log(`Migrating "${user.username}" as ADMIN`);
        firstUser = false;
      } else {
        // Other users become staff with default permissions
        user.role = "staff";
        user.permissions = {
          inventory: { view: true, add: false, edit: false, delete: false },
          sales: { view: true, add: true, edit: false, delete: false },
          users: { view: false, add: false, edit: false, delete: false },
        };
        user.isActive = true;
        console.log(`Migrating "${user.username}" as STAFF`);
      }

      await user.save();
    }

    console.log("\nMigration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error migrating users:", error);
    process.exit(1);
  }
};

migrateUsers();
