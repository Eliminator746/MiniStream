import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithRedirect, getCurrentUser } from "aws-amplify/auth";

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirectToCognitoLogin() {
      try {
        await getCurrentUser();
        navigate("/", { replace: true });
      } catch {
        await signInWithRedirect();
      }
    }

    redirectToCognitoLogin();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-sm text-slate-600">
        Redirecting to sign in...
      </span>
    </div>
  );
}
