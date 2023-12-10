const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const generateToken = (username) => {
  return jwt.sign({ username }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  const { username, password } = req.body;

  // Check if the username ends with "@gmail.com"
  if (!username.toLowerCase().endsWith("@gmail.com")) {
    return res
      .status(400)
      .json({ error: 'Username must end with "@gmail.com"' });
  }

  try {
    const newUser = new User({ username, password });
    await newUser.save();

    const token = generateToken(username);

    console.log("Generated Token during registration:", token);

    res.json({ message: "User registered successfully.", token });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = generateToken(username);

    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
