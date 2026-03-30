import { useEffect, useState } from "react";
import { fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, logout } from "../features/authSlice";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const LOGOUT_REDIRECT_URL =
  import.meta.env.VITE_LOGOUT_REDIRECT_URL ?? "http://localhost:5173";
const AUTH_TIMEOUT_MS = 12000;

async function getSessionWithTimeout() {
  return Promise.race([
    fetchAuthSession(),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Auth session timeout")),
        AUTH_TIMEOUT_MS,
      );
    }),
  ]);
}

async function getTokenWithRetry() {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const session = await getSessionWithTimeout();
    const token =
      session.tokens?.idToken?.toString() ??
      session.tokens?.accessToken?.toString() ??
      null;

    if (token) return token;

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return null;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSession() {
      try {
        if (!BASE_URL) throw new Error("VITE_API_URL is empty in this build");

        const t = await getTokenWithRetry();

        if (!t) throw new Error("No token");

        // Fetch the user's DB record (includes id) from the backend
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const dbUser = await res.json();

        const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };

        localStorage.setItem("token", t);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch(setCredentials({ user, token: t }));
        setToken(t);
      } catch {
        dispatch(logout());
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [dispatch]);

  async function signOut() {
    try {
      await amplifySignOut({
        global: false,
        oauth: {
          redirectUrl: LOGOUT_REDIRECT_URL,
        },
      });
    } catch {
      // ignore sign-out errors
    } finally {
      dispatch(logout());
      setToken(null);
      navigate("/login", { replace: true });
    }
  }

  return { token, loading, signOut };
}
