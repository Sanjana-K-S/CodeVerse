import { BrowserRouter, Routes, Route } from "react-router-dom";

import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import Editor from "./pages/Editor";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-project"
          element={
            <ProtectedRoute>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}