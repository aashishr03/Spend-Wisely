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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          is_default: boolean
          name: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category_id: string
          created_at: string
          id: string
          month: number
          monthly_limit: number
          user_id: string
          year: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          month: number
          monthly_limit: number
          user_id: string
          year: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          month?: number
          monthly_limit?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_system: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      insights_logs: {
        Row: {
          created_at: string
          generated_text: string
          id: string
          insight_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_text: string
          id?: string
          insight_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_text?: string
          id?: string
          insight_type?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_profiles: {
        Row: {
          created_at: string
          goals: string | null
          id: string
          monthly_investment_amount: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          user_id: string
        }
        Insert: {
          created_at?: string
          goals?: string | null
          id?: string
          monthly_investment_amount?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          user_id: string
        }
        Update: {
          created_at?: string
          goals?: string | null
          id?: string
          monthly_investment_amount?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          user_id?: string
        }
        Relationships: []
      }
      mentor_challenges: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          saved_amount: number
          started_at: string
          status: string
          target_savings: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          saved_amount?: number
          started_at?: string
          status?: string
          target_savings?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          saved_amount?: number
          started_at?: string
          status?: string
          target_savings?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency: string
          full_name: string | null
          goal_horizon: string | null
          id: string
          investment_experience: string | null
          money_source: string | null
          monthly_income: number | null
          onboarding_completed: boolean
          persona_age: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          primary_goal: string | null
          risk_appetite: number | null
          student_mode: boolean
          trial_ends_at: string | null
          trial_started_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          goal_horizon?: string | null
          id: string
          investment_experience?: string | null
          money_source?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean
          persona_age?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          primary_goal?: string | null
          risk_appetite?: number | null
          student_mode?: boolean
          trial_ends_at?: string | null
          trial_started_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency?: string
          full_name?: string | null
          goal_horizon?: string | null
          id?: string
          investment_experience?: string | null
          money_source?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean
          persona_age?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          primary_goal?: string | null
          risk_appetite?: number | null
          student_mode?: boolean
          trial_ends_at?: string | null
          trial_started_at?: string | null
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          category: string
          created_at: string
          icon_key: string
          id: string
          name: string
          saved_amount: number
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          icon_key?: string
          id?: string
          name: string
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          icon_key?: string
          id?: string
          name?: string
          saved_amount?: number
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_trial: boolean
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_trial?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          notes: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          ai_premium_queries_used: number
          created_at: string
          id: string
          month: number
          receipt_scans_used: number
          user_id: string
          voice_entries_used: number
          year: number
        }
        Insert: {
          ai_premium_queries_used?: number
          created_at?: string
          id?: string
          month: number
          receipt_scans_used?: number
          user_id: string
          voice_entries_used?: number
          year: number
        }
        Update: {
          ai_premium_queries_used?: number
          created_at?: string
          id?: string
          month?: number
          receipt_scans_used?: number
          user_id?: string
          voice_entries_used?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: "free" | "premium"
      risk_level: "low" | "medium" | "high"
      transaction_type: "income" | "expense"
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
      plan_type: ["free", "premium"],
      risk_level: ["low", "medium", "high"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
