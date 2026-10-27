export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          }
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
