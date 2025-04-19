import React from "react";
import KanbanBoard from "./components/KanbanBoard/KanbanBoard.jsx";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <h1 className="app-heading">Real-time Kanban Board</h1>
      <KanbanBoard />
    </div>
  );
}

export default App;
