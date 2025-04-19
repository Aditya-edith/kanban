import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./TaskForm.css";

const socket = io("http://localhost:3001");

const TaskForm = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "",
    category: "",
    status: "todo",
  });

  // If editing an existing task, populate form with task data
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "",
        category: task.category || "",
        status: task.status || "todo",
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.priority || !formData.category) {
      alert("Please fill in all required fields (Title, Priority, Category)");
      return;
    }

    const taskData = task ? { ...task, ...formData } : { ...formData };
    onSubmit(taskData);

    // Reset form after submission
    if (!task) {
      setFormData({
        title: "",
        description: "",
        priority: "",
        category: "",
        status: "todo",
      });
    }
  };

  return (
    <div className="task-form">
      <h2 className="form-title">{task ? "Edit Task" : "Add New Task"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Task Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter task description (optional)"
            rows="4"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Priority
              </option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select Category
              </option>
              <option value="Bug">Bug</option>
              <option value="Feature">Feature</option>
              <option value="Enhancement">Enhancement</option>
              <option value="Task">Task</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="todo">To Do</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {task ? "Update Task" : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
