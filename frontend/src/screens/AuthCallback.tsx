import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../features/authSlice";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function handleCallback() {
      try {
        const session = await fetchAuthSession();

        const token = session.tokens?.idToken?.toString();
        if (!token) throw new Error("No token");

        // Fetch the user's DB record (includes id) from the backend
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const dbUser = await res.json();

        const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };

        // store in localStorage so auth persists on refresh
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // update Redux state
        dispatch(setCredentials({ user, token }));

        navigate("/", { replace: true });
      } catch (err) {
        console.error("Callback error", err);
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
