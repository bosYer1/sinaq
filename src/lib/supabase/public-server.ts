import 'server-only';

import { createServerDataClient } from '@/lib/supabase/server-data';

/**
 * Legacy name retained so existing server-side query modules stay source-compatible.
 * Public club data must be read through the trusted server data client, never directly
 * from the browser publishable key.
 */
export function createPublicClient() {
  return createServerDataClient();
}
