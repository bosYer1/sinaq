/**
 * Public-inventory data can be cached across requests only if its trusted
 * Supabase read credentials are available without calling next/headers.
 * Production's request-scoped OIDC header fallback must remain uncached.
 */
export const PUBLIC_INVENTORY_CACHE_SECONDS = 300;

type CredentialEnvironment = Record<string, string | undefined>;

export function hasRequestIndependentPublicDataCredential(
  env: CredentialEnvironment = process.env,
): boolean {
  return Boolean(
    env.SUPABASE_SECRET_KEY?.trim()
    || env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || env.VERCEL_OIDC_TOKEN?.trim()
    || env.GAMEYER_CI_OIDC_TOKEN?.trim()
    || (env.ACTIONS_ID_TOKEN_REQUEST_URL?.trim() && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN?.trim())
  );
}
