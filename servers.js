const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5005;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Generate a JWT token for a user
const generateToken = (username) => {
  return jwt.sign({ username }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1h",
  });
};

app.post(
  "/api/register",
  checkUserEmail,
  checkJSONContentType,
  cors(),
  async (req, res) => {
    const { username, password } = req.body;

    // Check if the username ends with "@gmail.com"
    if (!username.toLowerCase().endsWith("@gmail.com")) {
      return res
        .status(400)
        .json({ error: 'Username cannot end with "@gmail.com"' });
    }

    // Create a new user
    try {
      const newUser = new User({ username, password });
      await newUser.save();

      // Generate a JWT token for the registered user
      const token = generateToken(username);

      // Log the generated token
      console.log("Generated Token during registration:", token);

      res.json({ message: "User registered successfully.", token });
      // Redirect to the to-do list (you can adjust the route as needed)
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Routes
app.post("/api/login", cors(), async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate user credentials
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate a JWT token for the authenticated user
    const token = generateToken(username);

    // Send the token as part of the response
    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define MongoDB Schema and Model (Task)
const taskSchema = new mongoose.Schema({
  username: String,
  task: Number,
  arbitrageRate: Number,
  currency: String,
  usd: Number,
  zar: Number,
});

const Task = mongoose.model("Task", taskSchema);

// Middleware for checking user email and JSON content type
function checkUserEmail(req, res, next) {
  const { username } = req.body;
  console.log("Username:", username); // Add this line for debugging
  if (!username) {
    return res.status(403).json({ error: "Invalid email address" });
  }
  next();
}

function checkJSONContentType(req, res, next) {
  if (req.get("Content-Type") !== "application/json") {
    return res
      .status(400)
      .json({ error: "Invalid content type. Only JSON is supported." });
  }
  next();
}

// Get Pricing Rate
const fetchArbitrageRate = async () => {
  try {
    const response = await fetch(
      "https://final-pricing-server-accfd4e36d9a.herokuapp.com/arbitrage-rate"
    );
    const data = await response.json();

    // Check if the response is successful (status code 2xx)
    if (response.ok) {
      return parseFloat(data.arbitrageRate).toFixed(2);
    } else {
      // If the response is not successful, throw an error
      throw new Error(`Failed to fetch arbitrage rate: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to fetch arbitrage rate", error);
    throw error;
  }
};

const usdRate = async () => {
  try {
    const response = await fetch(
      "https://final-pricing-server-accfd4e36d9a.herokuapp.com/kraken-price"
    );
    const data = await response.json();

    // Check if the response is successful (status code 2xx)
    if (response.ok) {
      return data.krakenPrice.toFixed(2);
    } else {
      // If the response is not successful, throw an error
      throw new Error(`Failed to fetch USD rate: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to fetch USD rate", error);
    throw error;
  }
};

const zarRate = async () => {
  try {
    const response = await fetch(
      "https://final-pricing-server-accfd4e36d9a.herokuapp.com/luno-price"
    );
    const data = await response.json();

    // Check if the response is successful (status code 2xx)
    if (response.ok) {
      return data.lunoPrice.toFixed(2);
    } else {
      // If the response is not successful, throw an error
      throw new Error(`Failed to fetch ZAR rate: ${data.error}`);
    }
  } catch (error) {
    console.error("Failed to fetch ZAR rate", error);
    throw error;
  }
};

// Protected routes with middleware
app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = decoded;
    next();
  });
});

app.post(
  "/api/addTask",
  checkUserEmail,
  checkJSONContentType,
  cors(),
  async (req, res) => {
    const { task, currency } = req.body;

    // Check if the task is provided in the request body
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    // Check if the task exceeds 140 characters
    if (task.length > 140) {
      return res
        .status(400)
        .json({ error: "Task cannot exceed 140 characters" });
    }

    try {
      // Fetch arbitrage rate (use the function you implemented earlier)
      const arbitrageRate = await fetchArbitrageRate();
      const usd = await usdRate();
      console.log("USD Data:", usd);
      const zar = await zarRate();
      console.log("ZAR Data:", zar);

      // Create a new Task instance with the provided task, username, arbitrageRate, and currency
      const newTask = new Task({
        username: req.user.username,
        task,
        arbitrageRate,
        currency,
        usd,
        zar,
      });

      // Save the task to the database
      await newTask.save();

      res.json({ message: "Task added successfully" });
    } catch (error) {
      console.error("Error adding task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Other routes for editing, removing, and reading tasks
// API endpoint to get the list of registered users
app.get("/api/users", cors(), async (req, res) => {
  try {
    // This is where the database query is placed
    const users = await User.find({}, { _id: 0, password: 0 }); // Exclude _id and password
    res.json(users);
  } catch (error) {
    console.error("Failed to fetch users", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new route to delete a user by ID
app.delete("/api/users/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by ID and remove it from the database
    const deletedUser = await User.findByIdAndRemove(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all tasks for a user
app.get("/api/getTasks", cors(), (req, res) => {
  // Replace this with actual logic to fetch tasks from the database
  Task.find({ username: req.user.username })
    .then((tasks) => res.json(tasks))
    .catch((error) => res.status(500).json({ error: "Internal server error" }));
});

// Get all tasks for a user
app.get("/api/tasks", cors(), (req, res) => {
  // Replace this with actual logic to fetch tasks from the database
  Task.find({ username: req.user.username })
    .then((tasks) => res.json({ tasks }))
    .catch((error) => res.status(500).json({ error: "Internal server error" }));
});

// Edit a task
app.put("/api/editTask/:taskId", cors(), checkJSONContentType, (req, res) => {
  const { taskId } = req.params;
  const { task } = req.body;

  // Replace this with actual logic to update the task in the database
  Task.findByIdAndUpdate(taskId, { task })
    .then(() => res.json({ message: "Task updated successfully" }))
    .catch((error) => res.status(500).json({ error: "Internal server error" }));
});

// Remove a task
app.delete("/api/removeTask/:taskId", cors(), (req, res) => {
  const { taskId } = req.params;

  console.log("Received request to delete task with ID:", taskId);

  // Replace this with actual logic to remove the task from the database
  Task.findOneAndDelete({ _id: taskId })
    .then((removedTask) => {
      if (!removedTask) {
        console.error("Task not found");
        return res.status(404).json({ error: "Task not found" });
      }

      console.log("Task removed successfully");
      res.json({ message: "Task removed successfully" });
    })
    .catch((error) => {
      console.error("Error removing task:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
