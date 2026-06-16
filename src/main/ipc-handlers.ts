import { ipcMain, app } from 'electron'
import { getDb } from './database'

export function registerHandlers(): void {
  ipcMain.handle('institute:get', () => {
    return getDb().prepare('SELECT * FROM institute WHERE id = 1').get()
  })

  ipcMain.handle('institute:save', (_e, data) => {
    const existing = getDb().prepare('SELECT id FROM institute WHERE id = 1').get()
    if (existing) {
      getDb().prepare('UPDATE institute SET name=?, address=?, phone=?, email=? WHERE id=1')
        .run(data.name, data.address, data.phone, data.email)
    } else {
      getDb().prepare('INSERT INTO institute (id, name, address, phone, email) VALUES (1,?,?,?,?)')
        .run(data.name, data.address, data.phone, data.email)
    }
    return { ok: true }
  })

  ipcMain.handle('students:list', (_e, search = '') => {
    const q = `%${search}%`
    return getDb().prepare(
      `SELECT s.*, b.name as batch_name, c.name as course_name
       FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE s.is_active = 1 AND (s.name LIKE ? OR s.student_id LIKE ? OR s.phone LIKE ?)
       ORDER BY s.created_at DESC`
    ).all(q, q, q)
  })

  ipcMain.handle('students:get', (_e, id) => {
    return getDb().prepare(
      `SELECT s.*, b.name as batch_name, c.name as course_name
       FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE s.id = ?`
    ).get(id)
  })

  ipcMain.handle('students:create', (_e, data) => {
    const year = new Date().getFullYear().toString().slice(-2)
    const count = (getDb().prepare('SELECT COUNT(*) as c FROM students').get() as { c: number }).c + 1
    const studentId = `STU${year}${String(count).padStart(4, '0')}`
    const info = getDb().prepare(
      `INSERT INTO students (student_id, name, phone, parent_name, parent_phone, email, address,
        batch_id, course_id, fee_type, fee_amount, discount, join_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      studentId, data.name, data.phone, data.parent_name, data.parent_phone,
      data.email, data.address, data.batch_id, data.course_id,
      data.fee_type, data.fee_amount, data.discount || 0,
      data.join_date || new Date().toISOString().split('T')[0]
    )
    return { id: info.lastInsertRowid, student_id: studentId }
  })

  ipcMain.handle('students:update', (_e, id, data) => {
    getDb().prepare(
      `UPDATE students SET name=?, phone=?, parent_name=?, parent_phone=?,
        email=?, address=?, batch_id=?, course_id=?, fee_type=?, fee_amount=?, discount=?
       WHERE id=?`
    ).run(
      data.name, data.phone, data.parent_name, data.parent_phone,
      data.email, data.address, data.batch_id, data.course_id,
      data.fee_type, data.fee_amount, data.discount || 0, id
    )
    return { ok: true }
  })

  ipcMain.handle('students:deactivate', (_e, id) => {
    getDb().prepare('UPDATE students SET is_active = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('courses:list', () => {
    return getDb().prepare('SELECT * FROM courses WHERE is_active = 1 ORDER BY name').all()
  })

  ipcMain.handle('courses:create', (_e, data) => {
    const info = getDb().prepare(
      'INSERT INTO courses (name, description, fee_monthly, fee_quarterly, fee_yearly) VALUES (?,?,?,?,?)'
    ).run(data.name, data.description, data.fee_monthly, data.fee_quarterly, data.fee_yearly)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('batches:list', () => {
    return getDb().prepare(
      `SELECT b.*, c.name as course_name FROM batches b
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE b.is_active = 1 ORDER BY b.name`
    ).all()
  })

  ipcMain.handle('batches:create', (_e, data) => {
    const info = getDb().prepare(
      'INSERT INTO batches (name, course_id, timing, teacher, capacity) VALUES (?,?,?,?,?)'
    ).run(data.name, data.course_id, data.timing, data.teacher, data.capacity || 30)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('fees:collect', (_e, data) => {
    const year = new Date().getFullYear().toString().slice(-2)
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const count = (getDb().prepare('SELECT COUNT(*) as c FROM fee_payments').get() as { c: number }).c + 1
    const receiptNo = `RCP${year}${month}${String(count).padStart(4, '0')}`
    getDb().prepare(
      `INSERT INTO fee_payments (receipt_no, student_id, amount, discount, total_paid,
        payment_date, period_from, period_to, payment_mode, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(
      receiptNo, data.student_id, data.amount, data.discount || 0, data.total_paid,
      data.payment_date || new Date().toISOString().split('T')[0],
      data.period_from, data.period_to, data.payment_mode || 'cash', data.notes
    )
    return { receipt_no: receiptNo }
  })

  ipcMain.handle('fees:history', (_e, studentId) => {
    return getDb().prepare(
      `SELECT fp.*, s.name as student_name, s.student_id as sid
       FROM fee_payments fp JOIN students s ON fp.student_id = s.id
       WHERE fp.student_id = ? ORDER BY fp.payment_date DESC`
    ).all(studentId)
  })

  ipcMain.handle('fees:receipt', (_e, receiptNo) => {
    return getDb().prepare(
      `SELECT fp.*, s.name as student_name, s.student_id as sid,
              s.phone, s.parent_name, b.name as batch_name, c.name as course_name,
              i.name as institute_name, i.address as institute_address, i.phone as institute_phone
       FROM fee_payments fp
       JOIN students s ON fp.student_id = s.id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN institute i ON i.id = 1
       WHERE fp.receipt_no = ?`
    ).get(receiptNo)
  })

  ipcMain.handle('reports:daily', (_e, date) => {
    return getDb().prepare(
      `SELECT fp.*, s.name as student_name, s.student_id as sid
       FROM fee_payments fp JOIN students s ON fp.student_id = s.id
       WHERE fp.payment_date = ? ORDER BY fp.created_at DESC`
    ).all(date)
  })

  ipcMain.handle('reports:monthly', (_e, year, month) => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-31`
    return getDb().prepare(
      `SELECT fp.*, s.name as student_name, s.student_id as sid
       FROM fee_payments fp JOIN students s ON fp.student_id = s.id
       WHERE fp.payment_date BETWEEN ? AND ? ORDER BY fp.payment_date DESC`
    ).all(from, to)
  })

  ipcMain.handle('reports:due-list', () => {
    return getDb().prepare(
      `SELECT s.*, b.name as batch_name, c.name as course_name, MAX(fp.payment_date) as last_paid
       FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN fee_payments fp ON fp.student_id = s.id
       WHERE s.is_active = 1 GROUP BY s.id ORDER BY last_paid ASC NULLS FIRST`
    ).all()
  })

  ipcMain.handle('reports:summary', () => {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = today.slice(0, 7)
    const todayTotal = (getDb().prepare(
      'SELECT COALESCE(SUM(total_paid), 0) as total FROM fee_payments WHERE payment_date = ?'
    ).get(today) as { total: number }).total
    const monthTotal = (getDb().prepare(
      'SELECT COALESCE(SUM(total_paid), 0) as total FROM fee_payments WHERE payment_date LIKE ?'
    ).get(`${thisMonth}%`) as { total: number }).total
    const totalStudents = (getDb().prepare(
      'SELECT COUNT(*) as c FROM students WHERE is_active = 1'
    ).get() as { c: number }).c
    return { today_total: todayTotal, month_total: monthTotal, total_students: totalStudents }
  })

  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:data-path', () => app.getPath('userData'))
}
