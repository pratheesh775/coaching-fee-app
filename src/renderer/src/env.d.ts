/// <reference types="vite/client" />

interface Window {
  api: {
    institute: {
      get: () => Promise<import('./types').Institute | null>
      save: (data: Partial<import('./types').Institute>) => Promise<{ ok: boolean }>
    }
    students: {
      list: (search?: string) => Promise<import('./types').Student[]>
      get: (id: number) => Promise<import('./types').Student | null>
      create: (data: Partial<import('./types').Student>) => Promise<{ id: number; student_id: string }>
      update: (id: number, data: Partial<import('./types').Student>) => Promise<{ ok: boolean }>
      deactivate: (id: number) => Promise<{ ok: boolean }>
    }
    courses: {
      list: () => Promise<import('./types').Course[]>
      create: (data: Partial<import('./types').Course>) => Promise<{ id: number }>
    }
    batches: {
      list: () => Promise<import('./types').Batch[]>
      create: (data: Partial<import('./types').Batch>) => Promise<{ id: number }>
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
    app: {
      version: () => Promise<string>
      dataPath: () => Promise<string>
    }
  }
}
