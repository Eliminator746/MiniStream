import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "aws-amplify/auth";

const OAUTH_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN;

export default function SignupPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function redirectToCognitoSignup() {
      try {
        await getCurrentUser();
        navigate("/", { replace: true });
      } catch {
        const signupUrl =
          `https://${OAUTH_DOMAIN}/login?` +
          `client_id=${encodeURIComponent(CLIENT_ID)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent("openid email profile")}` +
          `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
          `&screen_hint=signup`;
        window.location.assign(signupUrl);
      }
    }

    redirectToCognitoSignup();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <span className="ml-3 text-sm text-slate-600">
        Redirecting to sign up...
      </span>
    </div>
  );
}
