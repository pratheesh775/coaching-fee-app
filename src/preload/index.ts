import { contextBridge, ipcRenderer } from 'electron'

const api = {
  auth: {
    hasUsers: () => ipcRenderer.invoke('auth:has-users'),
    register: (data: unknown) => ipcRenderer.invoke('auth:register', data),
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    getSecurityQuestion: (username: string) => ipcRenderer.invoke('auth:get-security-question', username),
    resetPassword: (username: string, answer: string, newPassword: string) =>
      ipcRenderer.invoke('auth:reset-password', username, answer, newPassword),
    changePassword: (username: string, current: string, newPassword: string) =>
      ipcRenderer.invoke('auth:change-password', username, current, newPassword)
  },
  institute: {
    get: () => ipcRenderer.invoke('institute:get'),
    save: (data: unknown) => ipcRenderer.invoke('institute:save', data)
  },
  subjects: {
    list: () => ipcRenderer.invoke('subjects:list'),
    create: (data: unknown) => ipcRenderer.invoke('subjects:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('subjects:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('subjects:delete', id)
  },
  studentSubjects: {
    get: (studentId: number) => ipcRenderer.invoke('student-subjects:get', studentId),
    set: (studentId: number, subjects: unknown[]) => ipcRenderer.invoke('student-subjects:set', studentId, subjects)
  },
  students: {
    list: (opts?: unknown) => ipcRenderer.invoke('students:list', opts),
    get: (id: number) => ipcRenderer.invoke('students:get', id),
    create: (data: unknown) => ipcRenderer.invoke('students:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('students:update', id, data),
    deactivate: (id: number) => ipcRenderer.invoke('students:deactivate', id),
    getDue: (id: number) => ipcRenderer.invoke('students:due', id),
    getDuesList: () => ipcRenderer.invoke('students:dues-list')
  },
  courses: {
    list: () => ipcRenderer.invoke('courses:list'),
    create: (data: unknown) => ipcRenderer.invoke('courses:create', data)
  },
  batches: {
    list: (includeCompleted?: boolean) => ipcRenderer.invoke('batches:list', includeCompleted),
    create: (data: unknown) => ipcRenderer.invoke('batches:create', data),
    complete: (id: number) => ipcRenderer.invoke('batches:complete', id),
    reactivate: (id: number) => ipcRenderer.invoke('batches:reactivate', id)
  },
  fees: {
    collect: (data: unknown) => ipcRenderer.invoke('fees:collect', data),
    history: (studentId: number) => ipcRenderer.invoke('fees:history', studentId),
    receipt: (receiptNo: string) => ipcRenderer.invoke('fees:receipt', receiptNo)
  },
  reports: {
    daily: (date: string) => ipcRenderer.invoke('reports:daily', date),
    monthly: (year: number, month: number) => ipcRenderer.invoke('reports:monthly', year, month),
    dueList: () => ipcRenderer.invoke('reports:due-list'),
    summary: () => ipcRenderer.invoke('reports:summary')
  },
  attendance: {
    getWeek: (batchId: number, weekStart: string) => ipcRenderer.invoke('attendance:get-week', batchId, weekStart),
    mark: (data: unknown) => ipcRenderer.invoke('attendance:mark', data),
    markAll: (batchId: number, date: string, status: string) => ipcRenderer.invoke('attendance:mark-all', batchId, date, status),
    report: (batchId: number, fromDate: string, toDate: string) => ipcRenderer.invoke('attendance:report', batchId, fromDate, toDate)
  },
  holidays: {
    list: (fromDate?: string, toDate?: string) => ipcRenderer.invoke('holidays:list', fromDate, toDate),
    add: (date: string, name: string) => ipcRenderer.invoke('holidays:add', date, name),
    delete: (date: string) => ipcRenderer.invoke('holidays:delete', date)
  },
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    dataPath: () => ipcRenderer.invoke('app:data-path'),
    weeklyTrend: () => ipcRenderer.invoke('reports:weekly-trend')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
