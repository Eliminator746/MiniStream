import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { useEffect } from "react";
import { setCredentials } from "./features/authSlice";

import LoginPage from "./screens/Login";
import RegisterPage from "./screens/Register";
import Home from "./screens/Home";
import Profile from "./screens/Profile";
import VideoPage from "./screens/VideoPlayer";

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

function ProtectedRoute({ children, isAuthenticated }: ProtectedRouteProps) {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// Public Route Component (redirects to home if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

function PublicRoute({ children, isAuthenticated }: PublicRouteProps) {
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (user && token) {
      dispatch(
        setCredentials({
          user: JSON.parse(user),
          token,
        }),
      );
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route index element={<Home />} />

        <Route
          path="/login"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}

        <Route
          path="/video/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <VideoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
