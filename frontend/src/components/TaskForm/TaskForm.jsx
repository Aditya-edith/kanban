import React, { useState } from "react";
import { io } from "socket.io-client";
import "./TaskForm.css"; // Keep your custom styles

const socket = io("http://localhost:3001");

const TaskForm = () => {
  const [formVisible, setFormVisible] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("todo");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !priority || !category) {
      alert("Please fill in all required fields (Title, Priority, Category)");
      return;
    }

    socket.emit("task:create", {
      title,
      description,
      priority,
      category,
      status,
    });

    resetForm();
    setFormVisible(false); // Hide form after submission
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("");
    setCategory("");
    setStatus("todo");
  };

  return (
    <div className="task-form-container">
      {formVisible ? (
        <div className="task-form">
          <h2 className="form-title">Add New Task</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Task Title *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="task">Task</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="inProgress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  resetForm();
                  setFormVisible(false); // Hide form
                }}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Add Task
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setFormVisible(true)}
          className="toggle-form-btn"
        >
          + Add New Task
        </button>
      )}
    </div>
  );
};

export default TaskForm;
