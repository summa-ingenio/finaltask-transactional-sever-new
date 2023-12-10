const Task = require("../models/taskModel");

// Add a new task for the user
const addTask = (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  if (task.length > 140) {
    return res.status(400).json({ error: "Task cannot exceed 140 characters" });
  }

  const newTask = new Task({
    username: req.user.username,
    task,
  });

  newTask
    .save()
    .then(() => {
      res.json({ message: "Task added successfully" });
    })
    .catch((error) => {
      console.error("Error adding task:", error);
      res.status(500).json({ error: "Internal server error" });
    });
};

// Get all tasks for the user
const getTasks = (req, res) => {
  Task.find({ username: req.user.username })
    .then((tasks) => res.json(tasks))
    .catch((error) => res.status(500).json({ error: "Internal server error" }));
};

// Edit a task
const editTask = (req, res) => {
  const { taskId } = req.params;
  const { task } = req.body;

  Task.findByIdAndUpdate(taskId, { task })
    .then(() => res.json({ message: "Task updated successfully" }))
    .catch((error) => res.status(500).json({ error: "Internal server error" }));
};

// Remove a task
const removeTask = (req, res) => {
  const { taskId } = req.params;

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
};

module.exports = {
  addTask,
  getTasks,
  editTask,
  removeTask,
};
