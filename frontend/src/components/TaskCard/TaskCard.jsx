import React, { useState } from "react";
import "./TaskCard.css";

const TaskCard = ({ task, onEdit, onDelete, onFileUpload }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // const priorityColors = {
  //   Low: "#4caf50",
  //   Medium: "#ff9800",
  //   High: "#f44336",
  // };

  const categoryIcons = {
    Bug: "🐞",
    Feature: "⭐",
    Enhancement: "🚀",
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`task-card ${isExpanded ? "expanded" : ""}`}>
      <div className="task-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>{task.title}</h3>
        <div className="task-badges">
          {task.priority && (
            <span
              className="task-priority"
              // style={{ background: priorityColors[task.priority] }}
            >
              {task.priority}
            </span>
          )}
          {task.category && (
            <span className="task-category">
              {categoryIcons[task.category]} {task.category}
            </span>
          )}
        </div>
      </div>

      <div className={`task-details ${isExpanded ? "expanded" : "collapsed"}`}>
        <p>{task.description}</p>

        <div className="task-meta">
          {task.priority && (
            <div className="task-meta-item">
              <span className="meta-label">Priority:</span>
              <span>{task.priority}</span>
            </div>
          )}

          {task.category && (
            <div className="task-meta-item">
              <span className="meta-label">Category:</span>
              <span>{task.category}</span>
            </div>
          )}

          {task.createdAt && (
            <div className="task-meta-item">
              <span className="meta-label">Created:</span>
              <span>{new Date(task.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        {task.attachments && task.attachments.length > 0 && (
          <div className="task-attachments">
            <h4>Attachments:</h4>
            <div className="attachment-list">
              {task.attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-item">
                  {attachment.name.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                    <div className="attachment-preview">
                      <img
                        src={attachment.url || URL.createObjectURL(attachment)}
                        alt={attachment.name}
                      />
                    </div>
                  ) : (
                    <div className="attachment-file">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{attachment.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="task-actions">
          <label className="file-upload-btn">
            <input type="file" onChange={handleFileChange} />
            Add Attachment
          </label>
          <button className="edit-btn" onClick={onEdit}>
            Edit
          </button>
          <button className="delete-btn" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
