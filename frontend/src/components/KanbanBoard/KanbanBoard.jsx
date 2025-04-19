import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import io from "socket.io-client";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import TaskCard from "../TaskCard/TaskCard.jsx";
import TaskForm from "../TaskForm/TaskForm.jsx";
import "./KanbanBoard.css";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// WebSocket connection
const socket = io("http://localhost:3001");

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({
    todo: [],
    inProgress: [],
    done: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Handle initial data sync
    socket.on("sync:tasks", (allTasks) => {
      setTasks(allTasks);
      setIsLoading(false);
    });

    // Handle task created event
    socket.on("task:created", (newTask) => {
      setTasks((prev) => ({
        ...prev,
        [newTask.status]: [...prev[newTask.status], newTask],
      }));
    });

    // Handle task updated event
    socket.on("task:updated", (updatedTask) => {
      setTasks((prev) => {
        const column = updatedTask.status;
        return {
          ...prev,
          [column]: prev[column].map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          ),
        };
      });
    });

    // Handle task moved event
    socket.on("task:moved", ({ id, source, destination }) => {
      // This is just a notification, actual state is updated in sync:tasks
    });

    // Handle task deleted event
    socket.on("task:deleted", ({ id, status }) => {
      setTasks((prev) => ({
        ...prev,
        [status]: prev[status].filter((task) => task.id !== id),
      }));
    });

    // Handle attachment upload
    socket.on(
      "attachment:uploaded",
      ({ taskId, attachmentId, fileName, url }) => {
        setTasks((prev) => {
          const column = Object.keys(prev).find((col) =>
            prev[col].some((task) => task.id === taskId)
          );

          if (!column) return prev;

          return {
            ...prev,
            [column]: prev[column].map((task) => {
              if (task.id === taskId) {
                return {
                  ...task,
                  attachments: [
                    ...(task.attachments || []),
                    { id: attachmentId, name: fileName, url },
                  ],
                };
              }
              return task;
            }),
          };
        });
      }
    );

    // Clean up listeners on unmount
    return () => {
      socket.off("sync:tasks");
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:moved");
      socket.off("task:deleted");
      socket.off("attachment:uploaded");
    };
  }, []);

  // Handle drag end event
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Return if dropped outside a droppable area
    if (!destination) return;

    // Return if dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Move task in local state for immediate UI update
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    // Create a deep copy of tasks
    const newTasks = JSON.parse(JSON.stringify(tasks));

    // Find the task that was moved
    const movedTask = newTasks[sourceColumn].find(
      (task) => task.id === draggableId
    );
    if (!movedTask) return;

    // Remove from source
    newTasks[sourceColumn] = newTasks[sourceColumn].filter(
      (task) => task.id !== draggableId
    );

    // Add to destination
    movedTask.status = destColumn;
    newTasks[destColumn].splice(destination.index, 0, movedTask);

    setTasks(newTasks);

    // Emit the move event to the server
    socket.emit("task:move", {
      id: draggableId,
      source,
      destination,
    });
  };

  // Create a new task
  const handleCreateTask = (newTask) => {
    socket.emit("task:create", {
      ...newTask,
      status: "todo",
    });
    setShowTaskForm(false);
  };

  // Update an existing task
  const handleUpdateTask = (updatedTask) => {
    socket.emit("task:update", updatedTask);
    setEditingTask(null);
  };

  // Delete a task
  const handleDeleteTask = (taskId, status) => {
    socket.emit("task:delete", { id: taskId, status });
  };

  // Handle file upload for a task
  const handleFileUpload = (taskId, file) => {
    // In a real application, we would upload the file to a server first
    // Here we simulate the upload by directly emitting with file data
    socket.emit("attachment:upload", { taskId, file });
  };

  // Prepare chart data
  const chartData = {
    labels: ["To Do", "In Progress", "Done"],
    datasets: [
      {
        label: "Tasks",
        data: [tasks.todo.length, tasks.inProgress.length, tasks.done.length],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Task Progress",
      },
    },
  };

  // Calculate completion percentage
  const totalTasks =
    tasks.todo.length + tasks.inProgress.length + tasks.done.length;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((tasks.done.length / totalTasks) * 100);

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1>WebSocket Kanban Board</h1>
        <button className="add-task-btn" onClick={() => setShowTaskForm(true)}>
          Add New Task
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
        <>
          <div className="chart-container">
            <div className="completion-indicator">
              <h3>Completion: {completionPercentage}%</h3>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            <div className="chart">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {["todo", "inProgress", "done"].map((columnId, index) => {
                const columnTitle = {
                  todo: "To Do",
                  inProgress: "In Progress",
                  done: "Done",
                }[columnId];

                return (
                  <div className="kanban-column" key={columnId}>
                    <h2>
                      {columnTitle} ({tasks[columnId].length})
                    </h2>
                    <Droppable droppableId={columnId}>
                      {(provided) => (
                        <div
                          className="task-list"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {tasks[columnId].map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard
                                    task={task}
                                    onEdit={() => setEditingTask(task)}
                                    onDelete={() =>
                                      handleDeleteTask(task.id, columnId)
                                    }
                                    onFileUpload={(file) =>
                                      handleFileUpload(task.id, file)
                                    }
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </>
      )}

      {showTaskForm && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowTaskForm(false)}>
              &times;
            </span>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowTaskForm(false)}
            />
          </div>
        </div>
      )}

      {editingTask && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setEditingTask(null)}>
              &times;
            </span>
            <TaskForm
              task={editingTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
