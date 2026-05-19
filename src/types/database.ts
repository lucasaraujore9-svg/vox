// Tipos gerados automaticamente do Supabase via `mcp__supabase__generate_typescript_types`.
// Para regenerar: roda o MCP novamente ou `npx supabase gen types typescript --project-id jzotuzxqekzymvcitxpq`.
// Os aliases narrow no final espelham os CHECK constraints, útil pro app.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      block_color_preferences: {
        Row: {
          block_type: string
          color: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          block_type: string
          color: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          block_type?: string
          color?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_color_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          course_id: string
          created_at: string
          id: string
          order: number
          sermon_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          order: number
          sermon_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          order?: number
          sermon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          deleted_at: string | null
          ementa: string | null
          hours: number | null
          id: string
          objectives: string[]
          status: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ementa?: string | null
          hours?: number | null
          id?: string
          objectives?: string[]
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ementa?: string | null
          hours?: number | null
          id?: string
          objectives?: string[]
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_enabled: boolean
          avatar_url: string | null
          bible_version: string
          created_at: string
          denomination: string | null
          id: string
          is_active: boolean
          name: string
          plan: string
          role: string
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          avatar_url?: string | null
          bible_version?: string
          created_at?: string
          denomination?: string | null
          id: string
          is_active?: boolean
          name?: string
          plan?: string
          role?: string
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          avatar_url?: string | null
          bible_version?: string
          created_at?: string
          denomination?: string | null
          id?: string
          is_active?: boolean
          name?: string
          plan?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapter_exegeses: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          content: Json
          cost_usd: number
          created_at: string
          failed_groups: string[]
          generated_by: string | null
          generation_status: string
          id: string
          model: string
          tokens_in: number
          tokens_out: number
          updated_at: string
          version: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          content: Json
          cost_usd?: number
          created_at?: string
          failed_groups?: string[]
          generated_by?: string | null
          generation_status?: string
          id?: string
          model: string
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
          version: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          content?: Json
          cost_usd?: number
          created_at?: string
          failed_groups?: string[]
          generated_by?: string | null
          generation_status?: string
          id?: string
          model?: string
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      sermon_exegeses: {
        Row: {
          created_at: string
          exegesis_id: string
          sermon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exegesis_id: string
          sermon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exegesis_id?: string
          sermon_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          active_model: string
          id: number
          model_prices: Json
          monthly_user_cap_usd: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_model?: string
          id?: number
          model_prices?: Json
          monthly_user_cap_usd?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_model?: string
          id?: number
          model_prices?: Json
          monthly_user_cap_usd?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          parent_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          parent_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          parent_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_engagements: {
        Row: {
          audience_size: number | null
          created_at: string
          feedback: string | null
          id: string
          location: string | null
          preached_at: string
          rating: number | null
          sermon_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience_size?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          location?: string | null
          preached_at: string
          rating?: number | null
          sermon_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience_size?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          location?: string | null
          preached_at?: string
          rating?: number | null
          sermon_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_engagements_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_engagements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_versions: {
        Row: {
          bible_ref: string | null
          content: Json
          created_at: string
          framework: string | null
          id: string
          note: string | null
          sermon_id: string
          title: string
          user_id: string
          word_count: number
        }
        Insert: {
          bible_ref?: string | null
          content?: Json
          created_at?: string
          framework?: string | null
          id?: string
          note?: string | null
          sermon_id: string
          title: string
          user_id: string
          word_count?: number
        }
        Update: {
          bible_ref?: string | null
          content?: Json
          created_at?: string
          framework?: string | null
          id?: string
          note?: string | null
          sermon_id?: string
          title?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sermon_versions_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sermons: {
        Row: {
          archived_at: string | null
          bible_book: string | null
          bible_ref: string | null
          content: Json
          content_type: string
          created_at: string
          deleted_at: string | null
          framework: string
          id: string
          preached_at: string | null
          search_vector: unknown
          series_id: string | null
          slides_source: string | null
          slides_url: string | null
          status: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          archived_at?: string | null
          bible_book?: string | null
          bible_ref?: string | null
          content?: Json
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          framework?: string
          id?: string
          preached_at?: string | null
          search_vector?: unknown
          series_id?: string | null
          slides_source?: string | null
          slides_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          archived_at?: string | null
          bible_book?: string | null
          bible_ref?: string | null
          content?: Json
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          framework?: string
          id?: string
          preached_at?: string | null
          search_vector?: unknown
          series_id?: string | null
          slides_source?: string | null
          slides_url?: string | null
          status?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "sermons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_interests: {
        Row: {
          created_at: string
          denomination: string | null
          email: string
          id: string
          invited_at: string | null
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          source_ip: string | null
          source_ua: string | null
          status: string
        }
        Insert: {
          created_at?: string
          denomination?: string | null
          email: string
          id?: string
          invited_at?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          source_ip?: string | null
          source_ua?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          denomination?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          source_ip?: string | null
          source_ua?: string | null
          status?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          comment: string
          comment_items: Json
          created_at: string
          id: string
          image_url: string | null
          order: number
          sermon_id: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          comment?: string
          comment_items?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          order: number
          sermon_id: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string
          comment_items?: Json
          created_at?: string
          id?: string
          image_url?: string | null
          order?: number
          sermon_id?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slides_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      study_modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean
          session_count: number
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          session_count?: number
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          session_count?: number
          title?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_session: number
          id: string
          module_id: string
          notes_content: Json
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_session?: number
          id?: string
          module_id: string
          notes_content?: Json
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_session?: number
          id?: string
          module_id?: string
          notes_content?: Json
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "study_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// =========================================================================
// Aliases narrow, espelham CHECK constraints. Usados pelo app pra evitar
// "string" amplo em colunas com domínio fechado.
// =========================================================================

export type ContentType = "sermão" | "palestra" | "aula"
export type SermonType = "esboço" | "apresentação"
export type SermonStatus = "rascunho" | "pronto"
export type FrameworkId =
  | "expositivo"
  | "textual"
  | "narrativo"
  | "tematico"
  | "topico"
  | "livre"
export type SlidesSource = "upload" | "google_slides" | "manual"
export type CourseStatus = "rascunho" | "pronto" | "publicado"
export type StudyCategory =
  | "homilética"
  | "hermenêutica"
  | "teologia"
  | "comunicação"
  | "liderança"
  | "discipulado"
export type UserRole = "usuario" | "admin" | "super_admin"
export type SignupInterestStatus = "pending" | "invited" | "rejected" | "spam"
