import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@/lib/supabase/database.types';
import { serverEnv } from '@/lib/env/server-env';

type PrivateBillingDatabase = {
  public: Database['public'];
  private: {
    Tables: {
      billing_webhook_failures: {
        Row: {
          id: string;
          provider: string;
          reason: string;
          error_message: string;
          received_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          reason: string;
          error_message: string;
          received_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          reason?: string;
          error_message?: string;
          received_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      checkout_attempts: {
        Row: {
          id: string;
          user_id: string;
          plan_code: string;
          provider: string;
          provider_transaction_id: string | null;
          provider_checkout_url: string | null;
          idempotency_key: string;
          status: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          plan_code: string;
          provider: string;
          provider_transaction_id?: string | null;
          provider_checkout_url?: string | null;
          idempotency_key: string;
          status: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_transaction_id?: string | null;
          provider_checkout_url?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      billing_subscriptions: {
        Row: {
          user_id: string;
          provider: 'paddle' | 'doku';
          provider_customer_id: string;
          provider_subscription_id: string;
          plan_code: string;
          provider_status: string;
          normalized_status: Database['public']['Enums']['entitlement_status'];
          provider_occurred_at: string;
          current_period_start: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          last_event_id: string;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      project_billing_entitlement: {
        Args: {
          p_user_id: string;
          p_subscription_id: string;
          p_plan_code: string;
          p_status: Database['public']['Enums']['entitlement_status'];
          p_valid_from: string;
          p_valid_until: string | null;
          p_cancel_at_period_end: boolean;
          p_source_event_id: string;
        };
        Returns: Json;
      };
      process_normalized_billing_event: {
        Args: {
          p_provider: string;
          p_event_id: string;
          p_event_type: string;
          p_occurred_at: string;
          p_user_id: string;
          p_customer_id: string;
          p_subscription_id: string;
          p_plan_code: string;
          p_status: Database['public']['Enums']['entitlement_status'];
          p_valid_from: string;
          p_valid_until: string | null;
          p_cancel_at_period_end: boolean;
          p_payload_hash: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type BillingAdminClient = SupabaseClient<PrivateBillingDatabase>;

export function createSupabaseAdminClient(): BillingAdminClient {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Supabase service role key is required for billing webhooks');
  }

  return createClient<PrivateBillingDatabase>(serverEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
