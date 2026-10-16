import { TrueForge } from "@truefoundry/trueforge-sdk";

export function getTrueForgeClient(): TrueForge | null {
  const baseUrl = process.env.TRUEFORGE_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  const token = process.env.TRUEFORGE_TOKEN || process.env.TRUEFORGE_API_KEY;
  return new TrueForge({
    baseUrl,
    token,
  });
}

/**
 * Checks if TrueForge Agent Harness is active and configured
 */
export function isTrueForgeEnabled(): boolean {
  return Boolean(process.env.TRUEFORGE_BASE_URL);
}
