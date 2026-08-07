export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      browser_installations: {
        Row: {
          created_at: string
          display_name: string
          id: string
          last_seen_at: string
          push_capability: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          last_seen_at?: string
          push_capability?: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          last_seen_at?: string
          push_capability?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      check_in_history: {
        Row: {
          check_in_id: string
          id: string
          previous_friction_code: string | null
          previous_friction_note: string | null
          previous_outcome: Database["public"]["Enums"]["check_in_outcome"]
          previous_revision: number
          replaced_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          check_in_id: string
          id?: string
          previous_friction_code?: string | null
          previous_friction_note?: string | null
          previous_outcome: Database["public"]["Enums"]["check_in_outcome"]
          previous_revision: number
          replaced_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          check_in_id?: string
          id?: string
          previous_friction_code?: string | null
          previous_friction_note?: string | null
          previous_outcome?: Database["public"]["Enums"]["check_in_outcome"]
          previous_revision?: number
          replaced_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_history_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "today_session_view"
            referencedColumns: ["session_id"]
          },
        ]
      }
      check_ins: {
        Row: {
          created_at: string
          friction_code: string | null
          friction_note: string | null
          id: string
          outcome: Database["public"]["Enums"]["check_in_outcome"]
          recorded_at: string
          recorded_local_at: string
          revision: number
          session_id: string
          timezone_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friction_code?: string | null
          friction_note?: string | null
          id: string
          outcome: Database["public"]["Enums"]["check_in_outcome"]
          recorded_at?: string
          recorded_local_at: string
          revision?: number
          session_id: string
          timezone_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friction_code?: string | null
          friction_note?: string | null
          id?: string
          outcome?: Database["public"]["Enums"]["check_in_outcome"]
          recorded_at?: string
          recorded_local_at?: string
          revision?: number
          session_id?: string
          timezone_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "today_session_view"
            referencedColumns: ["session_id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          reminder_frequency: string
          reminder_opt_in: boolean
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          reminder_frequency?: string
          reminder_opt_in?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          reminder_frequency?: string
          reminder_opt_in?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          cancel_at_period_end: boolean
          id: string
          product_code: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          revision: number
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean
          id: string
          product_code: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          revision?: number
          status: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id: string
          valid_from: string
          valid_until?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean
          id?: string
          product_code?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          revision?: number
          status?: Database["public"]["Enums"]["entitlement_status"]
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      habit_versions: {
        Row: {
          created_at: string
          cue: Json | null
          effective_from_session_id: string | null
          habit_id: string
          id: string
          metadata: Json
          minimum_target: Json
          normal_target: Json
          parent_version_id: string | null
          recovery_structure: Json
          schedule_rule: Json
          source: string
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          cue?: Json | null
          effective_from_session_id?: string | null
          habit_id: string
          id: string
          metadata?: Json
          minimum_target: Json
          normal_target: Json
          parent_version_id?: string | null
          recovery_structure?: Json
          schedule_rule: Json
          source: string
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string
          cue?: Json | null
          effective_from_session_id?: string | null
          habit_id?: string
          id?: string
          metadata?: Json
          minimum_target?: Json
          normal_target?: Json
          parent_version_id?: string | null
          recovery_structure?: Json
          schedule_rule?: Json
          source?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_versions_effective_session_fk"
            columns: ["effective_from_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_versions_effective_session_fk"
            columns: ["effective_from_session_id"]
            isOneToOne: false
            referencedRelation: "today_session_view"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "habit_versions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "habit_versions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: string | null
          consecutive_manual_skips: number
          created_at: string
          current_version_id: string | null
          deleted_at: string | null
          id: string
          lifecycle_state: Database["public"]["Enums"]["habit_lifecycle_state"]
          purge_after: string | null
          revision: number
          state_changed_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          consecutive_manual_skips?: number
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id: string
          lifecycle_state?: Database["public"]["Enums"]["habit_lifecycle_state"]
          purge_after?: string | null
          revision?: number
          state_changed_at?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          consecutive_manual_skips?: number
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id?: string
          lifecycle_state?: Database["public"]["Enums"]["habit_lifecycle_state"]
          purge_after?: string | null
          revision?: number
          state_changed_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_current_version_fk"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["habit_id", "id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deletion_requested_at: string | null
          display_name: string | null
          id: string
          locale: string
          plan_code: Database["public"]["Enums"]["plan_tier"]
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          updated_at: string
          week_start: number
        }
        Insert: {
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          id: string
          locale?: string
          plan_code?: Database["public"]["Enums"]["plan_tier"]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          week_start?: number
        }
        Update: {
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          id?: string
          locale?: string
          plan_code?: Database["public"]["Enums"]["plan_tier"]
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          week_start?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          capability_status: string
          created_at: string
          encrypted_subscription: Json
          endpoint_hash: string
          id: string
          installation_id: string
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capability_status: string
          created_at?: string
          encrypted_subscription: Json
          endpoint_hash: string
          id: string
          installation_id: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capability_status?: string
          created_at?: string
          encrypted_subscription?: Json
          endpoint_hash?: string
          id?: string
          installation_id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "browser_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          created_version_id: string | null
          decided_at: string | null
          decision_payload: Json | null
          evidence: Json
          explanation_key: string
          habit_id: string
          habit_version_id: string
          id: string
          proposed_change: Json
          signal_code: string
          status: Database["public"]["Enums"]["recommendation_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_version_id?: string | null
          decided_at?: string | null
          decision_payload?: Json | null
          evidence: Json
          explanation_key: string
          habit_id: string
          habit_version_id: string
          id: string
          proposed_change: Json
          signal_code: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_version_id?: string | null
          decided_at?: string | null
          decision_payload?: Json | null
          evidence?: Json
          explanation_key?: string
          habit_id?: string
          habit_version_id?: string
          id?: string
          proposed_change?: Json
          signal_code?: string
          status?: Database["public"]["Enums"]["recommendation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_created_version_id_fkey"
            columns: ["created_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "recommendations_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_habit_version_id_fkey"
            columns: ["habit_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_sessions: number
          failure_sequence: number
          habit_id: string
          habit_version_id: string
          id: string
          started_at: string | null
          status: Database["public"]["Enums"]["recovery_plan_status"]
          success_threshold: number
          target_definition: Json
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_sessions?: number
          failure_sequence?: number
          habit_id: string
          habit_version_id: string
          id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["recovery_plan_status"]
          success_threshold?: number
          target_definition: Json
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_sessions?: number
          failure_sequence?: number
          habit_id?: string
          habit_version_id?: string
          id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["recovery_plan_status"]
          success_threshold?: number
          target_definition?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_plans_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "recovery_plans_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_plans_habit_version_id_fkey"
            columns: ["habit_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_configs: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          follow_up_minutes: number | null
          habit_id: string
          id: string
          local_time: string
          revision: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          enabled?: boolean
          follow_up_minutes?: number | null
          habit_id: string
          id: string
          local_time: string
          revision?: number
          timezone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          follow_up_minutes?: number | null
          habit_id?: string
          id?: string
          local_time?: string
          revision?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_configs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "reminder_configs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cycles: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          status: string
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id: string
          status?: string
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      review_items: {
        Row: {
          created_at: string
          habit_id: string | null
          id: string
          item_type: string
          payload: Json
          priority: number
          resolved_at: string | null
          review_cycle_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id?: string | null
          id: string
          item_type: string
          payload?: Json
          priority?: number
          resolved_at?: string | null
          review_cycle_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string | null
          id?: string
          item_type?: string
          payload?: Json
          priority?: number
          resolved_at?: string | null
          review_cycle_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_items_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "review_items_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_review_cycle_id_fkey"
            columns: ["review_cycle_id"]
            isOneToOne: false
            referencedRelation: "review_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_items_review_cycle_id_fkey"
            columns: ["review_cycle_id"]
            isOneToOne: false
            referencedRelation: "weekly_review_summary_view"
            referencedColumns: ["review_cycle_id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          eligible_at: string
          habit_id: string
          habit_version_id: string
          id: string
          resolution_due_at: string
          revision: number
          scheduled_local_date: string
          scheduled_local_time: string | null
          status: Database["public"]["Enums"]["session_status"]
          status_source: string
          timezone_snapshot: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          eligible_at: string
          habit_id: string
          habit_version_id: string
          id: string
          resolution_due_at: string
          revision?: number
          scheduled_local_date: string
          scheduled_local_time?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          status_source?: string
          timezone_snapshot: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          eligible_at?: string
          habit_id?: string
          habit_version_id?: string
          id?: string
          resolution_due_at?: string
          revision?: number
          scheduled_local_date?: string
          scheduled_local_time?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          status_source?: string
          timezone_snapshot?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_habit_version_id_fkey"
            columns: ["habit_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      habit_summary_view: {
        Row: {
          consecutive_manual_skips: number | null
          current_version_id: string | null
          habit_id: string | null
          lifecycle_state:
            | Database["public"]["Enums"]["habit_lifecycle_state"]
            | null
          resolved_sessions: number | null
          revision: number | null
          successful_sessions: number | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_current_version_fk"
            columns: ["habit_id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["habit_id", "id"]
          },
        ]
      }
      insight_consistency_view: {
        Row: {
          consistency_percentage: number | null
          habit_id: string | null
          resolved_sessions: number | null
          successful_sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_status_view: {
        Row: {
          cancel_at_period_end: boolean | null
          id: string | null
          product_code: string | null
          revision: number | null
          status: Database["public"]["Enums"]["entitlement_status"] | null
          updated_at: string | null
          user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          id?: string | null
          product_code?: string | null
          revision?: number | null
          status?: Database["public"]["Enums"]["entitlement_status"] | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          id?: string | null
          product_code?: string | null
          revision?: number | null
          status?: Database["public"]["Enums"]["entitlement_status"] | null
          updated_at?: string | null
          user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      today_session_view: {
        Row: {
          habit_id: string | null
          habit_title: string | null
          habit_version_id: string | null
          lifecycle_state:
            | Database["public"]["Enums"]["habit_lifecycle_state"]
            | null
          revision: number | null
          scheduled_local_date: string | null
          scheduled_local_time: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          timezone_snapshot: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habit_summary_view"
            referencedColumns: ["habit_id"]
          },
          {
            foreignKeyName: "sessions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_habit_version_id_fkey"
            columns: ["habit_version_id"]
            isOneToOne: false
            referencedRelation: "habit_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_review_summary_view: {
        Row: {
          pending_items: number | null
          resolved_items: number | null
          review_cycle_id: string | null
          status: string | null
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_habit: {
        Args: {
          p_command_id: string
          p_expected_revision: number
          p_habit_id: string
        }
        Returns: Json
      }
      create_habit: {
        Args: {
          p_activate: boolean
          p_category: string
          p_command_id: string
          p_cue: Json
          p_habit_id: string
          p_metadata: Json
          p_minimum_target: Json
          p_normal_target: Json
          p_recovery_structure: Json
          p_schedule_rule: Json
          p_title: string
          p_version_id: string
        }
        Returns: Json
      }
      create_habit_version: {
        Args: {
          p_command_id: string
          p_cue: Json
          p_expected_revision: number
          p_habit_id: string
          p_minimum_target: Json
          p_normal_target: Json
          p_recovery_structure: Json
          p_schedule_rule: Json
          p_source: string
          p_version_id: string
        }
        Returns: Json
      }
      ensure_session: {
        Args: {
          p_command_id: string
          p_eligible_at: string
          p_habit_id: string
          p_habit_version_id: string
          p_resolution_due_at: string
          p_scheduled_local_date: string
          p_scheduled_local_time: string
          p_session_id: string
          p_timezone_snapshot: string
        }
        Returns: Json
      }
      record_check_in: {
        Args: {
          p_check_in_id: string
          p_command_id: string
          p_expected_session_revision: number
          p_friction_code: string
          p_friction_note: string
          p_outcome: Database["public"]["Enums"]["check_in_outcome"]
          p_recorded_local_at: string
          p_session_id: string
          p_timezone_snapshot: string
        }
        Returns: Json
      }
      redesign_habit: {
        Args: {
          p_category: string
          p_command_id: string
          p_cue: Json
          p_expected_revision: number
          p_habit_id: string
          p_metadata: Json
          p_minimum_target: Json
          p_normal_target: Json
          p_recovery_structure: Json
          p_schedule_rule: Json
          p_source: string
          p_title: string
          p_version_id: string
        }
        Returns: Json
      }
      set_habit_lifecycle: {
        Args: {
          p_command_id: string
          p_expected_revision: number
          p_habit_id: string
          p_next_state: Database["public"]["Enums"]["habit_lifecycle_state"]
        }
        Returns: Json
      }
    }
    Enums: {
      check_in_outcome: "full" | "minimum" | "manual_skipped" | "excused"
      entitlement_status:
        | "trial_active"
        | "trial_cancelled"
        | "active"
        | "grace_period"
        | "past_due"
        | "cancelled"
        | "expired"
        | "refunded"
        | "revoked"
      habit_lifecycle_state:
        | "draft"
        | "starting"
        | "building"
        | "active"
        | "stable"
        | "at_risk"
        | "recovery"
        | "rebuilding"
        | "needs_review"
        | "paused"
        | "stopped"
        | "completed"
        | "archived"
        | "trash"
        | "decision_required"
      plan_tier: "free" | "lite" | "premium"
      recommendation_status:
        | "pending"
        | "applied"
        | "customized"
        | "kept_current"
        | "expired"
      recovery_plan_status:
        | "proposed"
        | "active"
        | "deferred"
        | "succeeded"
        | "failed"
        | "cancelled"
      session_status:
        | "unrecorded"
        | "full"
        | "minimum"
        | "manual_skipped"
        | "automatic_skipped"
        | "excused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      check_in_outcome: ["full", "minimum", "manual_skipped", "excused"],
      entitlement_status: [
        "trial_active",
        "trial_cancelled",
        "active",
        "grace_period",
        "past_due",
        "cancelled",
        "expired",
        "refunded",
        "revoked",
      ],
      habit_lifecycle_state: [
        "draft",
        "starting",
        "building",
        "active",
        "stable",
        "at_risk",
        "recovery",
        "rebuilding",
        "needs_review",
        "paused",
        "stopped",
        "completed",
        "archived",
        "trash",
        "decision_required",
      ],
      plan_tier: ["free", "lite", "premium"],
      recommendation_status: [
        "pending",
        "applied",
        "customized",
        "kept_current",
        "expired",
      ],
      recovery_plan_status: [
        "proposed",
        "active",
        "deferred",
        "succeeded",
        "failed",
        "cancelled",
      ],
      session_status: [
        "unrecorded",
        "full",
        "minimum",
        "manual_skipped",
        "automatic_skipped",
        "excused",
      ],
    },
  },
} as const
