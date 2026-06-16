export interface ElectronAPI {
  auth: {
    hasUsers: () => Promise<boolean>
    register: (data: Record<string, string>) => Promise<{ ok: boolean; error?: string }>
    login: (username: string, password: string) => Promise<{ ok: boolean; username?: string; id?: number; error?: string }>
    getSecurityQuestion: (username: string) => Promise<{ ok: boolean; question?: string; error?: string }>
    resetPassword: (username: string, answer: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
    changePassword: (username: string, current: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>
  }
  institute: {
    get: () => Promise<import('./types').Institute | null>
    save: (data: Partial<import('./types').Institute>) => Promise<{ ok: boolean }>
  }
  subjects: {
    list: () => Promise<import('./types').Subject[]>
    create: (data: Partial<import('./types').Subject>) => Promise<{ id: number }>
    update: (id: number, data: Partial<import('./types').Subject>) => Promise<{ ok: boolean }>
    delete: (id: number) => Promise<{ ok: boolean }>
  }
  studentSubjects: {
    get: (studentId: number) => Promise<import('./types').StudentSubject[]>
    set: (studentId: number, subjects: { subject_id: number; fee_override?: number }[]) => Promise<{ ok: boolean }>
  }
  students: {
    list: (opts?: { search?: string; course_id?: number; batch_id?: number; show_inactive?: boolean }) => Promise<import('./types').Student[]>
    get: (id: number) => Promise<import('./types').Student | null>
    create: (data: Partial<import('./types').Student>) => Promise<{ id: number; student_id: string }>
    update: (id: number, data: Partial<import('./types').Student>) => Promise<{ ok: boolean }>
    deactivate: (id: number) => Promise<{ ok: boolean }>
    getDue: (id: number) => Promise<{ due_amount: number; months_due: number; effective_fee: number }>
    getDuesList: () => Promise<(import('./types').Student & { due_amount: number; months_due: number })[]>
  }
  courses: {
    list: () => Promise<import('./types').Course[]>
    create: (data: Partial<import('./types').Course>) => Promise<{ id: number }>
  }
  batches: {
    list: (includeCompleted?: boolean) => Promise<import('./types').Batch[]>
    create: (data: Partial<import('./types').Batch>) => Promise<{ id: number }>
    complete: (id: number) => Promise<{ ok: boolean }>
    reactivate: (id: number) => Promise<{ ok: boolean }>
  }
  fees: {
    collect: (data: Partial<import('./types').FeePayment>) => Promise<{ receipt_no: string }>
    history: (studentId: number) => Promise<import('./types').FeePayment[]>
    receipt: (receiptNo: string) => Promise<import('./types').FeePayment | null>
  }
  reports: {
    daily: (date: string) => Promise<import('./types').FeePayment[]>
    monthly: (year: number, month: number) => Promise<import('./types').FeePayment[]>
    dueList: () => Promise<import('./types').Student[]>
    summary: () => Promise<import('./types').ReportSummary>
  }
  attendance: {
    getWeek: (batchId: number, weekStart: string) => Promise<import('./types').AttendanceWeek>
    mark: (data: { student_id: number; batch_id: number | null; date: string; status: string; comment?: string }) => Promise<{ ok: boolean }>
    markAll: (batchId: number, date: string, status: string) => Promise<{ ok: boolean }>
    report: (batchId: number, fromDate: string, toDate: string) => Promise<Record<string, unknown>[]>
  }
  holidays: {
    list: (fromDate?: string, toDate?: string) => Promise<import('./types').Holiday[]>
    add: (date: string, name: string) => Promise<{ ok: boolean }>
    delete: (date: string) => Promise<{ ok: boolean }>
  }
  app: {
    version: () => Promise<string>
    dataPath: () => Promise<string>
    weeklyTrend: () => Promise<{ date: string; total: number; label: string }[]>
  }
}
