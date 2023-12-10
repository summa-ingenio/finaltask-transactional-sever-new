const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");

// Add task
router.post("/addTask", taskController.addTask);

// Get tasks
router.get("/getTasks", taskController.getTasks);

// Edit task
router.put("/editTask/:taskId", taskController.editTask);

// Remove task
router.delete("/removeTask/:taskId", taskController.removeTask);

module.exports = router;
