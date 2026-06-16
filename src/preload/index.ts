import { contextBridge, ipcRenderer } from 'electron'

const api = {
  institute: {
    get: () => ipcRenderer.invoke('institute:get'),
    save: (data: unknown) => ipcRenderer.invoke('institute:save', data)
  },
  students: {
    list: (search?: string) => ipcRenderer.invoke('students:list', search),
    get: (id: number) => ipcRenderer.invoke('students:get', id),
    create: (data: unknown) => ipcRenderer.invoke('students:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('students:update', id, data),
    deactivate: (id: number) => ipcRenderer.invoke('students:deactivate', id)
  },
  courses: {
    list: () => ipcRenderer.invoke('courses:list'),
    create: (data: unknown) => ipcRenderer.invoke('courses:create', data)
  },
  batches: {
    list: () => ipcRenderer.invoke('batches:list'),
    create: (data: unknown) => ipcRenderer.invoke('batches:create', data)
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
  app: {
    version: () => ipcRenderer.invoke('app:version'),
    dataPath: () => ipcRenderer.invoke('app:data-path')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
