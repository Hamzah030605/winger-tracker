export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string
          name: string | null
          current_week: number
          plan_start_date: string
          created_at: string
        }
        Insert: {
          user_id: string
          name?: string | null
          current_week?: number
          plan_start_date?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          name?: string | null
          current_week?: number
          plan_start_date?: string
          created_at?: string
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          id: string
          user_id: string
          plan_type: string
          session_name: string
          week_number: number
          completed_at: string
          overall_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: string
          session_name: string
          week_number: number
          completed_at?: string
          overall_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: string
          session_name?: string
          week_number?: number
          completed_at?: string
          overall_notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_logs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      exercise_logs: {
        Row: {
          id: string
          session_log_id: string
          exercise_name: string
          sets: number | null
          reps: number | null
          weight: number | null
          rpe: number | null
          quality_rating: number | null
          confidence_rating: number | null
          weak_foot_notes: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_log_id: string
          exercise_name: string
          sets?: number | null
          reps?: number | null
          weight?: number | null
          rpe?: number | null
          quality_rating?: number | null
          confidence_rating?: number | null
          weak_foot_notes?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_log_id?: string
          exercise_name?: string
          sets?: number | null
          reps?: number | null
          weight?: number | null
          rpe?: number | null
          quality_rating?: number | null
          confidence_rating?: number | null
          weak_foot_notes?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'exercise_logs_session_log_id_fkey'
            columns: ['session_log_id']
            referencedRelation: 'session_logs'
            referencedColumns: ['id']
          }
        ]
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          logged_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          logged_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          logged_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'habit_logs_habit_id_fkey'
            columns: ['habit_id']
            referencedRelation: 'habits'
            referencedColumns: ['id']
          }
        ]
      }
      devops_topics: {
        Row: {
          id: string
          user_id: string
          topic_slug: string
          confidence: number
          notes: string | null
          completed_modules: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_slug: string
          confidence?: number
          notes?: string | null
          completed_modules?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_slug?: string
          confidence?: number
          notes?: string | null
          completed_modules?: number
          updated_at?: string
        }
        Relationships: []
      }
      devops_logs: {
        Row: {
          id: string
          user_id: string
          topic_slug: string
          duration_minutes: number
          notes: string | null
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_slug: string
          duration_minutes?: number
          notes?: string | null
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_slug?: string
          duration_minutes?: number
          notes?: string | null
          logged_at?: string
          created_at?: string
        }
        Relationships: []
      }
      devops_tasks: {
        Row: {
          id: string
          user_id: string
          task_key: string
          task_date: string
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_key: string
          task_date?: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_key?: string
          task_date?: string
          completed_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SessionLog = Database['public']['Tables']['session_logs']['Row']
export type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row']
export type InsertSessionLog = Database['public']['Tables']['session_logs']['Insert']
export type InsertExerciseLog = Database['public']['Tables']['exercise_logs']['Insert']

export type DevOpsTopicRow = Database['public']['Tables']['devops_topics']['Row']
export type DevOpsLog = Database['public']['Tables']['devops_logs']['Row']
export type DevOpsTask = Database['public']['Tables']['devops_tasks']['Row']
export type InsertDevOpsLog = Database['public']['Tables']['devops_logs']['Insert']

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type InsertHabit = Database['public']['Tables']['habits']['Insert']
export type InsertHabitLog = Database['public']['Tables']['habit_logs']['Insert']
