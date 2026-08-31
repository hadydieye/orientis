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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      academic_units: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          institution_id: string
          name: string
          review_status: string
          type: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id: string
          name: string
          review_status?: string
          type: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          name?: string
          review_status?: string
          type?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_units_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          end_date: string | null
          id: string
          is_current: boolean
          label: string
          start_date: string | null
        }
        Insert: {
          end_date?: string | null
          id?: string
          is_current?: boolean
          label: string
          start_date?: string | null
        }
        Update: {
          end_date?: string | null
          id?: string
          is_current?: boolean
          label?: string
          start_date?: string | null
        }
        Relationships: []
      }
      admission_requirements: {
        Row: {
          academic_year_id: string
          accepted_series: string[] | null
          age_limit: number | null
          created_by: string | null
          id: string
          min_average: number | null
          other_conditions: string | null
          program_id: string
          requires_competition: boolean | null
          requires_interview: boolean | null
          review_status: string
          source_id: string | null
          subject_min_grades: Json | null
          verified_at: string | null
        }
        Insert: {
          academic_year_id: string
          accepted_series?: string[] | null
          age_limit?: number | null
          created_by?: string | null
          id?: string
          min_average?: number | null
          other_conditions?: string | null
          program_id: string
          requires_competition?: boolean | null
          requires_interview?: boolean | null
          review_status?: string
          source_id?: string | null
          subject_min_grades?: Json | null
          verified_at?: string | null
        }
        Update: {
          academic_year_id?: string
          accepted_series?: string[] | null
          age_limit?: number | null
          created_by?: string | null
          id?: string
          min_average?: number | null
          other_conditions?: string | null
          program_id?: string
          requires_competition?: boolean | null
          requires_interview?: boolean | null
          review_status?: string
          source_id?: string | null
          subject_min_grades?: Json | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_requirements_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_requirements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_requirements_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      application_procedures: {
        Row: {
          academic_year_id: string
          id: string
          program_id: string
        }
        Insert: {
          academic_year_id: string
          id?: string
          program_id: string
        }
        Update: {
          academic_year_id?: string
          id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_procedures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_procedures_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      application_steps: {
        Row: {
          cost: number | null
          deadline: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          link: string | null
          procedure_id: string
          step_number: number
          title: string
        }
        Insert: {
          cost?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          link?: string | null
          procedure_id: string
          step_number: number
          title: string
        }
        Update: {
          cost?: number | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          link?: string | null
          procedure_id?: string
          step_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_steps_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "application_procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          academic_unit_id: string
          contact: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          review_status: string
        }
        Insert: {
          academic_unit_id: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          review_status?: string
        }
        Update: {
          academic_unit_id?: string
          contact?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          review_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_academic_unit_id_fkey"
            columns: ["academic_unit_id"]
            isOneToOne: false
            referencedRelation: "academic_units"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          accepted_format: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          accepted_format?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          accepted_format?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fees: {
        Row: {
          academic_year_id: string
          amount: number | null
          conditions: string | null
          created_by: string | null
          currency: string
          fee_type: string
          frequency: string
          id: string
          program_id: string
          review_status: string
          source_id: string | null
          verified_at: string | null
        }
        Insert: {
          academic_year_id: string
          amount?: number | null
          conditions?: string | null
          created_by?: string | null
          currency?: string
          fee_type: string
          frequency: string
          id?: string
          program_id: string
          review_status?: string
          source_id?: string | null
          verified_at?: string | null
        }
        Update: {
          academic_year_id?: string
          amount?: number | null
          conditions?: string | null
          created_by?: string | null
          currency?: string
          fee_type?: string
          frequency?: string
          id?: string
          program_id?: string
          review_status?: string
          source_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fees_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      // Ajoutée à la main : la migration 20260830000000_institution_photos.sql
      // est appliquée, mais la régénération des types passe par le projet
      // Supabase relié au MCP, qui n'est pas celui-ci.
      institution_photos: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          id: string
          institution_id: string
          photo_url: string
          review_status: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id: string
          photo_url: string
          review_status?: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id?: string
          photo_url?: string
          review_status?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_photos_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      // Ajoutée à la main : la régénération des types passe par le projet
      // Supabase relié au MCP, qui n'est pas celui-ci.
      institution_sources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          institution_id: string
          note: string | null
          review_status: string
          source_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id: string
          note?: string | null
          review_status?: string
          source_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          institution_id?: string
          note?: string | null
          review_status?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_sources_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          city: string | null
          commune: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          facebook: string | null
          founded_year: number | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string | null
          recognition_status: string | null
          review_status: string
          status: string
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          commune?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          founded_year?: number | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone?: string | null
          recognition_status?: string | null
          review_status?: string
          status: string
          type: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          commune?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          founded_year?: number | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string | null
          recognition_status?: string | null
          review_status?: string
          status?: string
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      program_documents: {
        Row: {
          document_id: string
          id: string
          is_mandatory: boolean | null
          original_or_copy: string
          program_id: string
        }
        Insert: {
          document_id: string
          id?: string
          is_mandatory?: boolean | null
          original_or_copy: string
          program_id: string
        }
        Update: {
          document_id?: string
          id?: string
          is_mandatory?: boolean | null
          original_or_copy?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_documents_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          career_prospects: string | null
          code: string | null
          created_at: string
          created_by: string | null
          curriculum: string | null
          degree_awarded: string | null
          department_id: string
          description: string | null
          domain: string | null
          duration_years: number | null
          further_studies: string | null
          id: string
          language: string
          level: string
          name: string
          review_status: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          career_prospects?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          curriculum?: string | null
          degree_awarded?: string | null
          department_id: string
          description?: string | null
          domain?: string | null
          duration_years?: number | null
          further_studies?: string | null
          id?: string
          language?: string
          level: string
          name: string
          review_status?: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          career_prospects?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          curriculum?: string | null
          degree_awarded?: string | null
          department_id?: string
          description?: string | null
          domain?: string | null
          duration_years?: number | null
          further_studies?: string | null
          id?: string
          language?: string
          level?: string
          name?: string
          review_status?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          id: string
          label: string
          source_type: string
          status: string
          url: string | null
          verified_at: string | null
        }
        Insert: {
          id?: string
          label: string
          source_type: string
          status?: string
          url?: string | null
          verified_at?: string | null
        }
        Update: {
          id?: string
          label?: string
          source_type?: string
          status?: string
          url?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          average: number | null
          budget: number | null
          city: string | null
          created_at: string
          id: string
          interests: string[] | null
          series: string | null
          subject_grades: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          average?: number | null
          budget?: number | null
          city?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          series?: string | null
          subject_grades?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          average?: number | null
          budget?: number | null
          city?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          series?: string | null
          subject_grades?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string }; Returns: boolean }
      recommend_programs: {
        Args: { p_average: number; p_series: string }
        Returns: {
          career_prospects: string | null
          code: string | null
          created_at: string
          created_by: string | null
          curriculum: string | null
          degree_awarded: string | null
          department_id: string
          description: string | null
          domain: string | null
          duration_years: number | null
          further_studies: string | null
          id: string
          language: string
          level: string
          name: string
          review_status: string
          specialty: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "programs"
          isOneToOne: false
          isSetofReturn: true
        }
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
    Enums: {},
  },
} as const

