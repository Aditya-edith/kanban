// src/tests/unit/TaskCard.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskCard from "../../components/TaskCard/TaskCard.jsx";

describe("TaskCard Component", () => {
  const mockTask = {
    id: "1",
    title: "Test Task",
    description: "This is a test task",
    priority: "Medium",
    category: "Feature",
    createdAt: new Date().toISOString(),
    attachments: [{ id: "att1", name: "test.pdf", url: "/test.pdf" }],
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onFileUpload: vi.fn(),
  };

  it("renders task title correctly", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("displays task priority badge", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("displays task category badge", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);
    expect(screen.getByText(/Feature/)).toBeInTheDocument();
  });

  it("expands when clicked to show description", async () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);

    // Initially description is not visible
    expect(screen.queryByText("This is a test task")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Test Task").closest("div"));

    // Description should now be visible
    expect(screen.getByText("This is a test task")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);

    // Expand card first
    fireEvent.click(screen.getByText("Test Task").closest("div"));

    // Click edit button
    fireEvent.click(screen.getByText("Edit"));

    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);

    // Expand card first
    fireEvent.click(screen.getByText("Test Task").closest("div"));

    // Click delete button
    fireEvent.click(screen.getByText("Delete"));

    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it("shows attachment when available", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);

    // Expand card first
    fireEvent.click(screen.getByText("Test Task").closest("div"));

    // Check for attachment
    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("calls onFileUpload when file is selected", () => {
    render(<TaskCard task={mockTask} {...mockHandlers} />);

    // Expand card first
    fireEvent.click(screen.getByText("Test Task").closest("div"));

    // Mock file upload
    const file = new File(["dummy content"], "test.png", { type: "image/png" });
    const fileInput = screen.getByLabelText(/Add Attachment/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockHandlers.onFileUpload).toHaveBeenCalledWith(file);
  });
});
