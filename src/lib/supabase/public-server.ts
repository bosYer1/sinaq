import 'server-only';

import { createServerDataClient } from '@/lib/supabase/server-data';

/**
 * Legacy name retained so existing server-side query modules stay source-compatible.
 * Production public club data traverses the trusted Vercel OIDC -> Supabase Edge path.
 */
export async function createPublicClient() {
  return createServerDataClient();
}
