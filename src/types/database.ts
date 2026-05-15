// Tipos do banco — fonte canônica deve ser gerada via:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// Este arquivo é um shim escrito à mão para destravar build/typecheck enquanto não
// há projeto Supabase real configurado. Substitua pelo output do gen-types assim que
// o projeto for criado.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentType = "sermão" | "palestra" | "aula";
export type SermonType = "esboço" | "apresentação";
export type SermonStatus = "rascunho" | "pronto";
export type FrameworkId =
  | "expositivo"
  | "textual"
  | "narrativo"
  | "tematico"
  | "topico"
  | "livre";
export type SlidesSource = "upload" | "google_slides" | "manual";
export type CourseStatus = "rascunho" | "pronto" | "publicado";
export type StudyCategory =
  | "homilética"
  | "hermenêutica"
  | "teologia"
  | "comunicação"
  | "liderança"
  | "discipulado";

type Rel = never[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          denomination: string | null;
          avatar_url: string | null;
          ai_enabled: boolean;
          bible_version: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          denomination?: string | null;
          avatar_url?: string | null;
          ai_enabled?: boolean;
          bible_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          denomination?: string | null;
          avatar_url?: string | null;
          ai_enabled?: boolean;
          bible_version?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Rel;
      };
      series: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: Rel;
      };
      sermons: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          framework: FrameworkId;
          bible_ref: string | null;
          bible_book: string | null;
          status: SermonStatus;
          series_id: string | null;
          tags: string[];
          content: Json;
          word_count: number;
          preached_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          type: SermonType;
          content_type: ContentType;
          slides_source: SlidesSource | null;
          slides_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          framework?: FrameworkId;
          bible_ref?: string | null;
          bible_book?: string | null;
          status?: SermonStatus;
          series_id?: string | null;
          tags?: string[];
          content?: Json;
          word_count?: number;
          preached_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          type?: SermonType;
          content_type?: ContentType;
          slides_source?: SlidesSource | null;
          slides_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          framework?: FrameworkId;
          bible_ref?: string | null;
          bible_book?: string | null;
          status?: SermonStatus;
          series_id?: string | null;
          tags?: string[];
          content?: Json;
          word_count?: number;
          preached_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          type?: SermonType;
          content_type?: ContentType;
          slides_source?: SlidesSource | null;
          slides_url?: string | null;
        };
        Relationships: Rel;
      };
      slides: {
        Row: {
          id: string;
          sermon_id: string;
          order: number;
          image_url: string | null;
          storage_path: string | null;
          comment: string;
          comment_items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sermon_id: string;
          order: number;
          image_url?: string | null;
          storage_path?: string | null;
          comment?: string;
          comment_items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sermon_id?: string;
          order?: number;
          image_url?: string | null;
          storage_path?: string | null;
          comment?: string;
          comment_items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Rel;
      };
      courses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          ementa: string | null;
          objectives: string[];
          hours: number | null;
          status: CourseStatus;
          tags: string[];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          ementa?: string | null;
          objectives?: string[];
          hours?: number | null;
          status?: CourseStatus;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          ementa?: string | null;
          objectives?: string[];
          hours?: number | null;
          status?: CourseStatus;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: Rel;
      };
      course_lessons: {
        Row: {
          id: string;
          course_id: string;
          sermon_id: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          sermon_id: string;
          order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          sermon_id?: string;
          order?: number;
          created_at?: string;
        };
        Relationships: Rel;
      };
      study_modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: StudyCategory | null;
          estimated_hours: number | null;
          session_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: StudyCategory | null;
          estimated_hours?: number | null;
          session_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: StudyCategory | null;
          estimated_hours?: number | null;
          session_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: Rel;
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          notes_content: Json;
          current_session: number;
          progress: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          notes_content?: Json;
          current_session?: number;
          progress?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          notes_content?: Json;
          current_session?: number;
          progress?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Rel;
      };
      sermon_engagements: {
        Row: {
          id: string;
          sermon_id: string;
          user_id: string;
          preached_at: string;
          location: string | null;
          audience_size: number | null;
          rating: number | null;
          feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sermon_id: string;
          user_id: string;
          preached_at: string;
          location?: string | null;
          audience_size?: number | null;
          rating?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sermon_id?: string;
          user_id?: string;
          preached_at?: string;
          location?: string | null;
          audience_size?: number | null;
          rating?: number | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Rel;
      };
      sermon_versions: {
        Row: {
          id: string;
          sermon_id: string;
          user_id: string;
          title: string;
          framework: string | null;
          bible_ref: string | null;
          content: Json;
          word_count: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sermon_id: string;
          user_id: string;
          title: string;
          framework?: string | null;
          bible_ref?: string | null;
          content?: Json;
          word_count?: number;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sermon_id?: string;
          user_id?: string;
          title?: string;
          framework?: string | null;
          bible_ref?: string | null;
          content?: Json;
          word_count?: number;
          note?: string | null;
          created_at?: string;
        };
        Relationships: Rel;
      };
      block_color_preferences: {
        Row: {
          id: string;
          user_id: string;
          block_type: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          block_type: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          block_type?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: Rel;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
