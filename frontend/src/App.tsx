import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAppSelector } from "./store/hooks";
import { lazy, Suspense } from "react";
import Header from "./components/Header";
import AuthCallback from "./screens/AuthCallback";
import { useAuth } from "./hooks/useAuth";

const LoginPage = lazy(() => import("./screens/Login"));
const RegisterPage = lazy(() => import("./screens/Register"));
const Home = lazy(() => import("./screens/Home"));
const Profile = lazy(() => import("./screens/Profile"));
const VideoPage = lazy(() => import("./screens/VideoPlayer"));
const UploadPage = lazy(() => import("./screens/Upload"));

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

function ProtectedRoute({ children, isAuthenticated }: ProtectedRouteProps) {
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

interface PublicRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

function PublicRoute({ children, isAuthenticated }: PublicRouteProps) {
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function AppLayout() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[calc(100vh-64px)]">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route
          path="/login"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <Suspense fallback={null}>
                <LoginPage />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <Suspense fallback={null}>
                <RegisterPage />
              </Suspense>
            </PublicRoute>
          }
        />

        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <UploadPage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
