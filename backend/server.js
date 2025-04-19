const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory storage for tasks
const tasks = {
  todo: [],
  inProgress: [],
  done: [],
};

// File storage (simulated)
const attachments = {};

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send all tasks to newly connected client
  socket.emit("sync:tasks", tasks);

  // Task creation
  socket.on("task:create", (task) => {
    const newTask = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    tasks[task.status || "todo"].push(newTask);
    io.emit("task:created", newTask);
    io.emit("sync:tasks", tasks);
  });

  // Task update
  socket.on("task:update", (updatedTask) => {
    const { id, status } = updatedTask;
    const column = status || findTaskColumn(id);

    if (column) {
      const index = tasks[column].findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks[column][index] = { ...tasks[column][index], ...updatedTask };
        io.emit("task:updated", tasks[column][index]);
        io.emit("sync:tasks", tasks);
      }
    }
  });

  // Task move
  socket.on("task:move", ({ id, source, destination }) => {
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (!tasks[sourceColumn] || !tasks[destColumn]) {
      return;
    }

    const taskIndex = tasks[sourceColumn].findIndex((task) => task.id === id);
    if (taskIndex === -1) return;

    // Remove from source column
    const [movedTask] = tasks[sourceColumn].splice(taskIndex, 1);

    // Add to destination column
    movedTask.status = destColumn;
    tasks[destColumn].splice(destination.index, 0, movedTask);

    io.emit("task:moved", { id, source, destination });
    io.emit("sync:tasks", tasks);
  });

  // Task delete
  socket.on("task:delete", ({ id, status }) => {
    const column = status || findTaskColumn(id);

    if (column) {
      const index = tasks[column].findIndex((task) => task.id === id);
      if (index !== -1) {
        tasks[column].splice(index, 1);
        io.emit("task:deleted", { id, status: column });
        io.emit("sync:tasks", tasks);
      }
    }
  });

  // File upload (simulated)
  socket.on("attachment:upload", ({ taskId, file }) => {
    const attachmentId = uuidv4();
    attachments[attachmentId] = file;

    io.emit("attachment:uploaded", {
      taskId,
      attachmentId,
      fileName: file.name,
      url: `/attachments/${attachmentId}`, // Simulated URL
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Helper function to find which column contains a task
function findTaskColumn(taskId) {
  for (const [column, columnTasks] of Object.entries(tasks)) {
    if (columnTasks.some((task) => task.id === taskId)) {
      return column;
    }
  }
  return null;
}

// API endpoint to get all tasks (REST fallback)
app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

// Simulated file download endpoint for attachments
app.get("/attachments/:attachmentId", (req, res) => {
  const attachment = attachments[req.params.attachmentId];
  if (attachment) {
    res.setHeader("Content-Type", attachment.type);
    res.send(attachment.data);
  } else {
    res.status(404).send("Attachment not found");
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
