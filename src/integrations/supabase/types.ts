export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_memberships: {
        Row: {
          account_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["account_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name: string
          plan: Database["public"]["Enums"]["account_plan"]
          slug: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          plan?: Database["public"]["Enums"]["account_plan"]
          slug: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          plan?: Database["public"]["Enums"]["account_plan"]
          slug?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          account_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          account_id: string
          campaign_id: string | null
          cost_cents: number | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          external_session_id: string | null
          flow_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          started_at: string
          status: Database["public"]["Enums"]["call_status"]
        }
        Insert: {
          account_id: string
          campaign_id?: string | null
          cost_cents?: number | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          external_session_id?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["call_status"]
        }
        Update: {
          account_id?: string
          campaign_id?: string | null
          cost_cents?: number | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          external_session_id?: string | null
          flow_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["call_status"]
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_lead_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts: {
        Row: {
          call_id: string
          created_at: string
          id: string
          metadata: Json | null
          offset_ms: number
          segment_index: number
          speaker: Database["public"]["Enums"]["speaker_type"]
          text: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          offset_ms?: number
          segment_index: number
          speaker: Database["public"]["Enums"]["speaker_type"]
          text: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          offset_ms?: number
          segment_index?: number
          speaker?: Database["public"]["Enums"]["speaker_type"]
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          entry_type: Database["public"]["Enums"]["campaign_entry_type"]
          id: string
          metadata: Json | null
          name: string
          primary_flow_id: string | null
          public_url: string | null
          qr_code_url: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
          widget_code: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          entry_type?: Database["public"]["Enums"]["campaign_entry_type"]
          id?: string
          metadata?: Json | null
          name: string
          primary_flow_id?: string | null
          public_url?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          widget_code?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          entry_type?: Database["public"]["Enums"]["campaign_entry_type"]
          id?: string
          metadata?: Json | null
          name?: string
          primary_flow_id?: string | null
          public_url?: string | null
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          widget_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_primary_flow_fkey"
            columns: ["primary_flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          account_id: string
          campaign_id: string | null
          created_at: string
          definition: Json
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          account_id: string
          campaign_id?: string | null
          created_at?: string
          definition?: Json
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          account_id?: string
          campaign_id?: string | null
          created_at?: string
          definition?: Json
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "flows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flows_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_requests: {
        Row: {
          account_id: string
          assigned_to_user_id: string | null
          call_id: string | null
          campaign_id: string | null
          claimed_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["handoff_priority"]
          reason: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["handoff_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_to_user_id?: string | null
          call_id?: string | null
          campaign_id?: string | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["handoff_priority"]
          reason?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["handoff_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_to_user_id?: string | null
          call_id?: string | null
          campaign_id?: string | null
          claimed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["handoff_priority"]
          reason?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["handoff_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          account_id: string
          active: boolean
          config: Json
          created_at: string
          id: string
          last_synced_at: string | null
          name: string
          type: Database["public"]["Enums"]["integration_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          name: string
          type: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          last_synced_at?: string | null
          name?: string
          type?: Database["public"]["Enums"]["integration_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          account_id: string
          created_at: string
          file_size_bytes: number | null
          id: string
          metadata: Json | null
          mime_type: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at: string
          uri_or_path: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title: string
          updated_at?: string
          uri_or_path?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          file_size_bytes?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          title?: string
          updated_at?: string
          uri_or_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          account_id: string
          config: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["knowledge_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          account_id: string
          call_id: string | null
          campaign_id: string | null
          consent_ticket_id: string | null
          created_at: string
          email: string | null
          id: string
          intent_summary: string | null
          metadata: Json | null
          name: string | null
          notes: string | null
          phone: string | null
          score: number | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          call_id?: string | null
          campaign_id?: string | null
          consent_ticket_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          intent_summary?: string | null
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          call_id?: string | null
          campaign_id?: string | null
          consent_ticket_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          intent_summary?: string | null
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          metadata: Json | null
          name: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_account_ids: { Args: never; Returns: string[] }
      has_account_role: {
        Args: {
          _account_id: string
          _required_role: Database["public"]["Enums"]["account_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      account_plan: "free" | "pro" | "business" | "enterprise"
      account_role: "owner" | "admin" | "member" | "agent"
      account_status: "active" | "suspended" | "cancelled"
      call_status:
        | "connecting"
        | "active"
        | "completed"
        | "failed"
        | "abandoned"
      campaign_entry_type: "qr_code" | "web_widget" | "direct_link" | "api"
      campaign_status: "draft" | "active" | "paused" | "archived"
      document_status: "pending" | "processing" | "completed" | "failed"
      handoff_priority: "low" | "medium" | "high" | "urgent"
      handoff_status:
        | "pending"
        | "claimed"
        | "in_progress"
        | "resolved"
        | "cancelled"
      integration_type: "slack" | "asana" | "webhook" | "email" | "crm"
      knowledge_source_type:
        | "uploaded_doc"
        | "web_crawl"
        | "manual_qna"
        | "api_sync"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "unqualified"
      speaker_type: "caller" | "ai_agent" | "human_agent" | "system"
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
      account_plan: ["free", "pro", "business", "enterprise"],
      account_role: ["owner", "admin", "member", "agent"],
      account_status: ["active", "suspended", "cancelled"],
      call_status: ["connecting", "active", "completed", "failed", "abandoned"],
      campaign_entry_type: ["qr_code", "web_widget", "direct_link", "api"],
      campaign_status: ["draft", "active", "paused", "archived"],
      document_status: ["pending", "processing", "completed", "failed"],
      handoff_priority: ["low", "medium", "high", "urgent"],
      handoff_status: [
        "pending",
        "claimed",
        "in_progress",
        "resolved",
        "cancelled",
      ],
      integration_type: ["slack", "asana", "webhook", "email", "crm"],
      knowledge_source_type: [
        "uploaded_doc",
        "web_crawl",
        "manual_qna",
        "api_sync",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "unqualified",
      ],
      speaker_type: ["caller", "ai_agent", "human_agent", "system"],
    },
  },
} as const
