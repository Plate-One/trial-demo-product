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
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          organization_id: string
          slug: string
          name: string
          short_name: string
          address: string | null
          seat_count: number
          operating_hour_start: number
          operating_hour_end: number
          hourly_wage_hall: number
          hourly_wage_kitchen: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          slug: string
          name: string
          short_name: string
          address?: string | null
          seat_count?: number
          operating_hour_start?: number
          operating_hour_end?: number
          hourly_wage_hall?: number
          hourly_wage_kitchen?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          slug?: string
          name?: string
          short_name?: string
          address?: string | null
          seat_count?: number
          operating_hour_start?: number
          operating_hour_end?: number
          hourly_wage_hall?: number
          hourly_wage_kitchen?: number
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          auth_user_id: string | null
          organization_id: string
          store_id: string
          name: string
          name_kana: string
          avatar_url: string | null
          position: 'ホール' | 'キッチン' | '両方'
          role: '店長' | 'マネージャー' | 'チーフ' | 'スタッフ'
          detail_role: string | null
          employment_type: '正社員' | 'パート' | 'アルバイト'
          schedule_type: '早番' | '遅番' | '通し' | 'シフト制' | null
          phone: string | null
          email: string
          join_date: string | null
          hourly_rate: number | null
          address: string | null
          birthday: string | null
          notes: string | null
          status: '在籍' | '休職' | '退職'
          emergency_contact: Json | null
          availability: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id?: string | null
          organization_id: string
          store_id: string
          name: string
          name_kana: string
          avatar_url?: string | null
          position: 'ホール' | 'キッチン' | '両方'
          role: '店長' | 'マネージャー' | 'チーフ' | 'スタッフ'
          detail_role?: string | null
          employment_type: '正社員' | 'パート' | 'アルバイト'
          schedule_type?: '早番' | '遅番' | '通し' | 'シフト制' | null
          phone?: string | null
          email: string
          join_date?: string | null
          hourly_rate?: number | null
          address?: string | null
          birthday?: string | null
          notes?: string | null
          status?: '在籍' | '休職' | '退職'
          emergency_contact?: Json | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string | null
          organization_id?: string
          store_id?: string
          name?: string
          name_kana?: string
          avatar_url?: string | null
          position?: 'ホール' | 'キッチン' | '両方'
          role?: '店長' | 'マネージャー' | 'チーフ' | 'スタッフ'
          detail_role?: string | null
          employment_type?: '正社員' | 'パート' | 'アルバイト'
          schedule_type?: '早番' | '遅番' | '通し' | 'シフト制' | null
          phone?: string | null
          email?: string
          join_date?: string | null
          hourly_rate?: number | null
          address?: string | null
          birthday?: string | null
          notes?: string | null
          status?: '在籍' | '休職' | '退職'
          emergency_contact?: Json | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_skills: {
        Row: {
          id: string
          staff_id: string
          name: string
          level: number
          experience: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          name: string
          level?: number
          experience?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          name?: string
          level?: number
          experience?: string | null
          created_at?: string
        }
      }
      staff_certifications: {
        Row: {
          id: string
          staff_id: string
          name: string
          obtained_date: string | null
          expires_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          name: string
          obtained_date?: string | null
          expires_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          name?: string
          obtained_date?: string | null
          expires_date?: string | null
          created_at?: string
        }
      }
      shift_periods: {
        Row: {
          id: string
          store_id: string
          period_start: string
          period_end: string
          status: 'draft' | 'collecting' | 'optimized' | 'confirmed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          period_start: string
          period_end: string
          status?: 'draft' | 'collecting' | 'optimized' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          period_start?: string
          period_end?: string
          status?: 'draft' | 'collecting' | 'optimized' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
      }
      shift_requests: {
        Row: {
          id: string
          shift_period_id: string
          staff_id: string
          submission_type: '休暇希望' | '出勤希望'
          submitted_at: string | null
          requested_days_off: number[] | null
          available_days: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_period_id: string
          staff_id: string
          submission_type: '休暇希望' | '出勤希望'
          submitted_at?: string | null
          requested_days_off?: number[] | null
          available_days?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_period_id?: string
          staff_id?: string
          submission_type?: '休暇希望' | '出勤希望'
          submitted_at?: string | null
          requested_days_off?: number[] | null
          available_days?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          store_id: string
          shift_period_id: string | null
          staff_id: string
          date: string
          start_time: string
          end_time: string
          role: 'ホール' | 'キッチン'
          status: 'draft' | 'optimized' | 'confirmed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          shift_period_id?: string | null
          staff_id: string
          date: string
          start_time: string
          end_time: string
          role: 'ホール' | 'キッチン'
          status?: 'draft' | 'optimized' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          shift_period_id?: string | null
          staff_id?: string
          date?: string
          start_time?: string
          end_time?: string
          role?: 'ホール' | 'キッチン'
          status?: 'draft' | 'optimized' | 'confirmed'
          created_at?: string
          updated_at?: string
        }
      }
      help_assignments: {
        Row: {
          id: string
          organization_id: string
          shift_period_id: string | null
          helper_staff_id: string
          from_store_id: string
          to_store_id: string
          date: string
          start_time: string
          end_time: string
          role: 'ホール' | 'キッチン'
          travel_minutes: number | null
          transport_cost: number | null
          status: 'proposed' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          shift_period_id?: string | null
          helper_staff_id: string
          from_store_id: string
          to_store_id: string
          date: string
          start_time: string
          end_time: string
          role: 'ホール' | 'キッチン'
          travel_minutes?: number | null
          transport_cost?: number | null
          status?: 'proposed' | 'confirmed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          shift_period_id?: string | null
          helper_staff_id?: string
          from_store_id?: string
          to_store_id?: string
          date?: string
          start_time?: string
          end_time?: string
          role?: 'ホール' | 'キッチン'
          travel_minutes?: number | null
          transport_cost?: number | null
          status?: 'proposed' | 'confirmed' | 'cancelled'
          created_at?: string
        }
      }
      demand_forecasts: {
        Row: {
          id: string
          store_id: string
          date: string
          forecast_customers: number | null
          forecast_sales: number | null
          hourly_data: Json
          weather: Json | null
          event: string | null
          is_holiday: boolean
          holiday_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          date: string
          forecast_customers?: number | null
          forecast_sales?: number | null
          hourly_data: Json
          weather?: Json | null
          event?: string | null
          is_holiday?: boolean
          holiday_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          date?: string
          forecast_customers?: number | null
          forecast_sales?: number | null
          hourly_data?: Json
          weather?: Json | null
          event?: string | null
          is_holiday?: boolean
          holiday_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
