const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = 5005;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Load user and task controllers
const userController = require("../todo-app-sever/controllers/userController");
const taskController = require("../todo-app-sever/controllers/taskController");

// Protected route middleware
app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Unauthorized" });
    req.user = decoded;
    next();
  });
});

// User routes
app.post("/api/register", userController.registerUser);
app.post("/api/login", userController.loginUser);

// Task routes
app.post("/api/addTask", taskController.addTask);
app.get("/api/getTasks", taskController.getTasks);
app.put("/api/editTask/:taskId", taskController.editTask);
app.delete("/api/removeTask/:taskId", taskController.removeTask);

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
