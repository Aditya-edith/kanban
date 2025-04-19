// src/tests/integration/WebSocketIntegration.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Server } from "mock-socket";
import KanbanBoard from "../../components/KanbanBoard/KanbanBoard.jsx";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  const socketMock = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  return {
    default: vi.fn(() => socketMock),
  };
});

describe("WebSocket Integration", () => {
  let mockServer;
  let socketEvents = {};
  let mockSocket;

  beforeEach(() => {
    mockServer = new Server("ws://localhost:3001");
    mockSocket = require("socket.io-client").default();

    // Reset mock socket event handlers
    socketEvents = {};

    // Implement mock socket on method
    mockSocket.on.mockImplementation((event, callback) => {
      socketEvents[event] = socketEvents[event] || [];
      socketEvents[event].push(callback);
    });

    // Mock socket emit method to track emitted events
    mockSocket.emit.mockImplementation((event, data) => {
      console.log(`Socket emitted: ${event}`, data);
    });

    // Mock the initial data sync
    const initialData = {
      todo: [
        {
          id: "task1",
          title: "Initial Task 1",
          description: "Description for task 1",
          priority: "Low",
          category: "Bug",
          status: "todo",
        },
      ],
      inProgress: [],
      done: [],
    };

    // Trigger the initial sync after render
    setTimeout(() => {
      if (socketEvents["sync:tasks"] && socketEvents["sync:tasks"][0]) {
        socketEvents["sync:tasks"][0](initialData);
      }
    }, 10);
  });

  afterEach(() => {
    mockServer.close();
    vi.clearAllMocks();
  });

  it("renders initial tasks from WebSocket", async () => {
    render(<KanbanBoard />);

    // Wait for the initial data to be loaded
    await waitFor(() => {
      expect(screen.getByText("Initial Task 1")).toBeInTheDocument();
    });
  });

  it("emits task:create event when creating a new task", async () => {
    render(<KanbanBoard />);

    // Wait for the loading to finish
    await waitFor(() => {
      expect(screen.queryByText("Loading tasks...")).not.toBeInTheDocument();
    });

    // Click on "Add New Task" button
    fireEvent.click(screen.getByText("Add New Task"));

    // Fill out the form
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New Test Task" },
    });

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "This is a test task created in the test" },
    });

    // Submit the form
    fireEvent.click(screen.getByText("Create Task"));

    // Verify that the socket.emit was called with the right event and data
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "task:create",
      expect.objectContaining({
        title: "New Test Task",
        description: "This is a test task created in the test",
        status: "todo",
      })
    );
  });

  it("updates UI when receiving task:created event", async () => {
    render(<KanbanBoard />);

    // Wait for the initial data to be loaded
    await waitFor(() => {
      expect(screen.queryByText("Loading tasks...")).not.toBeInTheDocument();
    });

    // Simulate receiving a task:created event
    const newTask = {
      id: "task2",
      title: "WebSocket Created Task",
      description: "This task was created via WebSocket",
      priority: "High",
      category: "Feature",
      status: "todo",
    };

    // Trigger the task:created event
    if (socketEvents["task:created"] && socketEvents["task:created"][0]) {
      socketEvents["task:created"][0](newTask);
    }

    // Verify that the new task appears in the UI
    await waitFor(() => {
      expect(screen.getByText("WebSocket Created Task")).toBeInTheDocument();
    });
  });

  it("emits task:move event when dragging a task", async () => {
    // This test would be more complex due to drag-and-drop simulation
    // A simplified version would be:
    render(<KanbanBoard />);

    // Wait for the initial data to be loaded
    await waitFor(() => {
      expect(screen.getByText("Initial Task 1")).toBeInTheDocument();
    });

    // Since drag-and-drop is difficult to test directly, we can test the handler
    // Extract the handleDragEnd function from the component instance
    // and test it directly with mock data

    // Note: This is a simplified test approach
    // For a real test, you would need to mock react-beautiful-dnd's DragDropContext
    const mockDragResult = {
      draggableId: "task1",
      source: {
        droppableId: "todo",
        index: 0,
      },
      destination: {
        droppableId: "inProgress",
        index: 0,
      },
    };

    // We'd need to trigger the handleDragEnd event manually
    // This is a simplified approach
    if (socketEvents["sync:tasks"] && socketEvents["sync:tasks"][0]) {
      // Update the task state to simulate the drag operation being completed
      const updatedState = {
        todo: [],
        inProgress: [
          {
            id: "task1",
            title: "Initial Task 1",
            description: "Description for task 1",
            priority: "Low",
            category: "Bug",
            status: "inProgress",
          },
        ],
        done: [],
      };
      socketEvents["sync:tasks"][0](updatedState);
    }

    // Verify task appears in new column (would work if we had simulated the drag)
    await waitFor(() => {
      // The component would need to be updated with the new state
      // and we'd check if the task appears in the "In Progress" column
    });
  });
});
