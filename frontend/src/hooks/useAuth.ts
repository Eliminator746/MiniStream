import { useEffect, useState } from "react";
import { signOut as amplifySignOut } from "aws-amplify/auth";
import { useAppDispatch } from "../store/hooks";
import { setCredentials, logout } from "../features/authSlice";
import { useNavigate } from "react-router-dom";
import { getTokenWithRetry } from "../features/authSession";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const LOGOUT_REDIRECT_URL =
  import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT ?? window.location.origin;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN ?? "";
const COGNITO_APP_CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID ?? "";

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
    dispatch(logout());
    setToken(null);

    try {
      await amplifySignOut({
        global: false,
        oauth: {
          redirectUrl: LOGOUT_REDIRECT_URL,
        },
      });
    } catch {
      // Fallback to explicit Hosted UI logout URL when Amplify signOut fails.
      if (COGNITO_DOMAIN && COGNITO_APP_CLIENT_ID) {
        const hostedLogoutUrl =
          `https://${COGNITO_DOMAIN}/logout?` +
          `client_id=${encodeURIComponent(COGNITO_APP_CLIENT_ID)}` +
          `&logout_uri=${encodeURIComponent(LOGOUT_REDIRECT_URL)}`;
        window.location.assign(hostedLogoutUrl);
        return;
      }
    }

    // Do not navigate to /login on logout; that screen immediately starts sign-in redirect.
    navigate("/", { replace: true });
  }

  return { token, loading, signOut };
}
