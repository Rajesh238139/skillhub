import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MyLearning from "./pages/MyLearning";
import InstructorDashboard from "./pages/InstructorDashboard";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route
            path="/my-learning"
            element={
              <PrivateRoute role="student">
                <MyLearning />
              </PrivateRoute>
            }
          />
          <Route
            path="/instructor"
            element={
              <PrivateRoute role="instructor">
                <InstructorDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
