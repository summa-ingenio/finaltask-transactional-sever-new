const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  username: String,
  task: String,
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
