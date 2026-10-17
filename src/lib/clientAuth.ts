import { getFirebaseAuth } from "@/lib/firebase";

/**
 * Authorization header for API calls. Only a real Firebase session yields a token;
 * preset demo personas have none and therefore get the read-only demo workspace.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const user = getFirebaseAuth()?.currentUser;
    if (!user) return {};
    return { authorization: `Bearer ${await user.getIdToken()}` };
  } catch {
    return {};
  }
}
