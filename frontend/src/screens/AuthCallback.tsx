import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../features/authSlice";
import { getTokenWithRetry } from "../features/authSession";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log("Step 1 - starting callback");

        if (!BASE_URL) {
          throw new Error("VITE_API_URL is empty in this build");
        }

        const token = await getTokenWithRetry();
        console.log("Step 2 - token acquired:", !!token);

        if (!token) {
          console.error("No token found in session");
          navigate("/login", { replace: true });
          return;
        }

        // Fetch the user's DB record (includes id) from the backend
        const res = await fetch(`${BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch user: ${res.status}`);
        }
        const dbUser = await res.json();

        const user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };

        // update Redux state
        dispatch(setCredentials({ user, token }));

        navigate("/", { replace: true });
      } catch (err) {
        console.error("Callback error", err);
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, [dispatch, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
