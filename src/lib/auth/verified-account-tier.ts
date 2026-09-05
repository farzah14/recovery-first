import 'server-only';

import type { PlanTier } from '@/domain/shared/plan-tier';
import { isPlanTier } from '@/domain/shared/plan-tier';
import type { Database } from '@/lib/supabase/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseDatabaseClient = SupabaseClient<Database>;

export type VerifiedAccountTier = {
  planTier: PlanTier;
  entitlementStatus: 'resolved' | 'unavailable';
};

export async function readVerifiedAccountTier(
  client: SupabaseDatabaseClient,
): Promise<VerifiedAccountTier> {
  try {
    const { data, error } = await client.rpc('effective_plan_tier');

    if (error || typeof data !== 'string' || !isPlanTier(data)) {
      return { planTier: 'free', entitlementStatus: 'unavailable' };
    }

    return { planTier: data, entitlementStatus: 'resolved' };
  } catch {
    return { planTier: 'free', entitlementStatus: 'unavailable' };
  }
}
