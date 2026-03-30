import { fetchAuthSession } from "aws-amplify/auth";

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

export async function getTokenWithRetry() {
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
