const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER (only once)
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful!",
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
