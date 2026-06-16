export interface User {
  id: number
  username: string
}

export interface Institute {
  id: number
  name: string
  address: string
  phone: string
  email: string
  logo_path?: string
}

export interface Subject {
  id: number
  name: string
  description?: string
  fee_monthly: number
  is_active: number
}

export interface StudentSubject {
  id: number
  student_id: number
  subject_id: number
  subject_name: string
  default_fee: number
  fee_override?: number
}

export interface Course {
  id: number
  name: string
  description?: string
  fee_monthly: number
  fee_quarterly: number
  fee_yearly: number
  is_active: number
}

export interface Batch {
  id: number
  name: string
  course_id: number
  course_name?: string
  timing?: string
  teacher?: string
  capacity: number
  status: 'active' | 'completed'
  completed_date?: string
  is_active: number
}

export interface Student {
  id: number
  student_id: string
  name: string
  phone?: string
  parent_name?: string
  parent_phone?: string
  email?: string
  address?: string
  photo_path?: string
  batch_id?: number
  batch_name?: string
  batch_status?: 'active' | 'completed'
  course_id?: number
  course_name?: string
  fee_type: 'monthly' | 'quarterly' | 'yearly'
  fee_structure: 'flat' | 'subject_wise'
  fee_amount: number
  discount: number
  due_date_type: 'joining_date' | 'specific_date'
  due_date_day: number
  join_date?: string
  is_active: number
  created_at: string
  // computed
  due_amount?: number
  months_due?: number
  effective_fee?: number
}

export interface FeePayment {
  id: number
  receipt_no: string
  student_id: number
  student_name?: string
  sid?: string
  amount: number
  discount: number
  total_paid: number
  payment_date: string
  period_from?: string
  period_to?: string
  payment_mode: string
  notes?: string
  batch_name?: string
  course_name?: string
  institute_name?: string
  institute_address?: string
  institute_phone?: string
  created_at: string
}

export interface ReportSummary {
  today_total: number
  month_total: number
  total_students: number
  due_student_count?: number
}
