const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register  (only use once to create the owner account)
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

module.exports = router;
