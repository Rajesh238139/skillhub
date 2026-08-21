import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/courses" replace />;

  return children;
}
