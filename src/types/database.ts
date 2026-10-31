export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          owner_id: string | null
          title: string
          event_type: 'wedding' | 'birthday' | 'community'
          event_date: string
          city: string
          guest_count: number
          total_budget_paise: number
          protected_category: string
          edit_key_hash: string
          share_key_hash: string
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          title: string
          event_type: 'wedding' | 'birthday' | 'community'
          event_date: string
          city: string
          guest_count: number
          total_budget_paise: number
          protected_category: string
          edit_key_hash: string
          share_key_hash: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          title?: string
          event_type?: 'wedding' | 'birthday' | 'community'
          event_date?: string
          city?: string
          guest_count?: number
          total_budget_paise?: number
          protected_category?: string
          edit_key_hash?: string
          share_key_hash?: string
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_versions: {
        Row: {
          id: string
          event_id: string
          version_number: number
          parent_version_id: string | null
          reason: string
          lines: Json
          tasks: Json
          totals: Json
          snapshot: Json | null
          is_accepted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          version_number: number
          parent_version_id?: string | null
          reason: string
          lines: Json
          tasks?: Json
          totals?: Json
          is_accepted?: boolean
          created_at?: string
        }
        Update: never // STRICTLY IMMUTABLE — updates forbidden in Phase 3
        Relationships: [
          {
            foreignKeyName: 'plan_versions_event_id_fkey'
            columns: ['event_id']
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plan_versions_parent_version_id_fkey'
            columns: ['parent_version_id']
            referencedRelation: 'plan_versions'
            referencedColumns: ['id']
          },
        ]
      }
      change_records: {
        Row: {
          id: string
          plan_version_id: string
          deltas: Json
          explanation: string
          is_floor_protected: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plan_version_id: string
          deltas?: Json
          explanation: string
          is_floor_protected?: boolean
          created_at?: string
        }
        Update: never // STRICTLY IMMUTABLE — updates forbidden in Phase 3
        Relationships: [
          {
            foreignKeyName: 'change_records_plan_version_id_fkey'
            columns: ['plan_version_id']
            referencedRelation: 'plan_versions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    // The tables above are closed to the browser (see migration 20261031000000). All access goes
    // through these token-checked functions, which take the PLAIN capability token.
    Functions: {
      create_event: {
        Args: {
          p_title: string
          p_event_type: 'wedding' | 'birthday' | 'community'
          p_event_date: string
          p_city: string
          p_guest_count: number
          p_total_budget_paise: number
          p_protected_category: string
          p_snapshot: Json
          p_reason?: string
        }
        Returns: Json
      }
      verify_edit_key: {
        Args: { p_event_id: string; p_edit_key: string }
        Returns: boolean
      }
      get_editable_plan: {
        Args: { p_event_id: string; p_edit_key: string }
        Returns: Json
      }
      save_plan_version: {
        Args: {
          p_event_id: string
          p_edit_key: string
          p_parent_version_id: string | null
          p_snapshot: Json
          p_reason: string
          p_is_floor_protected?: boolean
        }
        Returns: Json
      }
      list_plan_versions: {
        Args: { p_event_id: string; p_edit_key: string }
        Returns: Json
      }
      regenerate_share_key: {
        Args: { p_event_id: string; p_edit_key: string }
        Returns: Json
      }
      get_shared_plan: {
        Args: { p_share_key: string }
        Returns: {
          id: string
          title: string
          event_type: 'wedding' | 'birthday' | 'community'
          event_date: string
          city: string
          guest_count: number
          total_budget_paise: number
          protected_category: string
          status: 'active' | 'archived'
          lines: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
