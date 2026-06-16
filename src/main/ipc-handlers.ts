import { ipcMain, app } from 'electron'
import { getDb, hashPassword } from './database'

function localDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcDue(studentId: number): { due_amount: number; months_due: number; effective_fee: number } {
  const db = getDb()
  const s = db.prepare(
    `SELECT s.*, COUNT(fp.id) as payment_count
     FROM students s
     LEFT JOIN fee_payments fp ON fp.student_id = s.id
     WHERE s.id = ?`
  ).get(studentId) as any
  if (!s) return { due_amount: 0, months_due: 0, effective_fee: 0 }

  const today = new Date()
  const joinDate = new Date(s.join_date || s.created_at.split('T')[0])
  const effectiveFee = Math.max(0, s.fee_amount - s.discount)

  // Months from join to today (inclusive)
  const totalMonths =
    (today.getFullYear() - joinDate.getFullYear()) * 12 +
    (today.getMonth() - joinDate.getMonth()) +
    1

  let expected = 0
  if (s.fee_type === 'monthly') {
    expected = Math.max(1, totalMonths)
    // If today is before the due day this month, subtract 1
    const dueDay = s.due_date_type === 'specific_date' ? (s.due_date_day || 1) : joinDate.getDate()
    if (today.getDate() < dueDay && totalMonths > 0) expected -= 1
  } else if (s.fee_type === 'quarterly') {
    expected = Math.max(1, Math.ceil(totalMonths / 3))
  } else if (s.fee_type === 'yearly') {
    expected = Math.max(1, Math.ceil(totalMonths / 12))
  }

  // For subject-wise, recalculate effective fee from subjects
  if (s.fee_structure === 'subject_wise') {
    const subjectTotal = (db.prepare(
      `SELECT COALESCE(SUM(COALESCE(ss.fee_override, sub.fee_monthly)), 0) as total
       FROM student_subjects ss
       JOIN subjects sub ON ss.subject_id = sub.id
       WHERE ss.student_id = ?`
    ).get(studentId) as any)?.total ?? 0
    const subjectEff = Math.max(0, subjectTotal - s.discount)
    const months_due = Math.max(0, expected - s.payment_count)
    return { due_amount: months_due * subjectEff, months_due, effective_fee: subjectEff }
  }

  const months_due = Math.max(0, expected - s.payment_count)
  return { due_amount: months_due * effectiveFee, months_due, effective_fee: effectiveFee }
}

export function registerHandlers(): void {
  // ─── Auth ─────────────────────────────────────────────────────────────────
  ipcMain.handle('auth:has-users', () => {
    const row = getDb().prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
    return row.c > 0
  })

  ipcMain.handle('auth:register', (_e, data) => {
    try {
      getDb().prepare(
        'INSERT INTO users (username, password_hash, security_question, security_answer_hash) VALUES (?,?,?,?)'
      ).run(
        data.username,
        hashPassword(data.password),
        data.security_question || null,
        data.security_answer ? hashPassword(data.security_answer.toLowerCase().trim()) : null
      )
      return { ok: true }
    } catch {
      return { ok: false, error: 'Username already exists' }
    }
  })

  ipcMain.handle('auth:login', (_e, username, password) => {
    const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) return { ok: false, error: 'Invalid username or password' }
    if (user.password_hash !== hashPassword(password)) return { ok: false, error: 'Invalid username or password' }
    return { ok: true, username: user.username, id: user.id }
  })

  ipcMain.handle('auth:get-security-question', (_e, username) => {
    const user = getDb().prepare('SELECT security_question FROM users WHERE username = ?').get(username) as any
    if (!user) return { ok: false, error: 'User not found' }
    return { ok: true, question: user.security_question }
  })

  ipcMain.handle('auth:reset-password', (_e, username, securityAnswer, newPassword) => {
    const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) return { ok: false, error: 'User not found' }
    if (user.security_answer_hash !== hashPassword(securityAnswer.toLowerCase().trim())) {
      return { ok: false, error: 'Security answer incorrect' }
    }
    getDb().prepare('UPDATE users SET password_hash = ? WHERE username = ?')
      .run(hashPassword(newPassword), username)
    return { ok: true }
  })

  ipcMain.handle('auth:change-password', (_e, username, currentPassword, newPassword) => {
    const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) return { ok: false, error: 'User not found' }
    if (user.password_hash !== hashPassword(currentPassword)) return { ok: false, error: 'Current password incorrect' }
    getDb().prepare('UPDATE users SET password_hash = ? WHERE username = ?')
      .run(hashPassword(newPassword), username)
    return { ok: true }
  })

  // ─── Institute ────────────────────────────────────────────────────────────
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

  // ─── Subjects ─────────────────────────────────────────────────────────────
  ipcMain.handle('subjects:list', () => {
    return getDb().prepare('SELECT * FROM subjects WHERE is_active = 1 ORDER BY name').all()
  })

  ipcMain.handle('subjects:create', (_e, data) => {
    const info = getDb().prepare(
      'INSERT INTO subjects (name, description, fee_monthly) VALUES (?,?,?)'
    ).run(data.name, data.description || null, data.fee_monthly || 0)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('subjects:update', (_e, id, data) => {
    getDb().prepare('UPDATE subjects SET name=?, description=?, fee_monthly=? WHERE id=?')
      .run(data.name, data.description || null, data.fee_monthly || 0, id)
    return { ok: true }
  })

  ipcMain.handle('subjects:delete', (_e, id) => {
    getDb().prepare('UPDATE subjects SET is_active = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  // ─── Student Subjects ─────────────────────────────────────────────────────
  ipcMain.handle('student-subjects:get', (_e, studentId) => {
    return getDb().prepare(
      `SELECT ss.*, sub.name as subject_name, sub.fee_monthly as default_fee
       FROM student_subjects ss
       JOIN subjects sub ON ss.subject_id = sub.id
       WHERE ss.student_id = ?`
    ).all(studentId)
  })

  ipcMain.handle('student-subjects:set', (_e, studentId, subjects) => {
    const db = getDb()
    db.prepare('DELETE FROM student_subjects WHERE student_id = ?').run(studentId)
    const stmt = db.prepare('INSERT INTO student_subjects (student_id, subject_id, fee_override) VALUES (?,?,?)')
    for (const s of subjects) {
      stmt.run(studentId, s.subject_id, s.fee_override || null)
    }
    return { ok: true }
  })

  // ─── Students ─────────────────────────────────────────────────────────────
  ipcMain.handle('students:list', (_e, opts) => {
    const search = opts?.search || ''
    const courseId = opts?.course_id || null
    const batchId = opts?.batch_id || null
    const showInactive = opts?.show_inactive || false

    const q = `%${search}%`
    let where = showInactive ? '1=1' : 's.is_active = 1'
    const params: any[] = [q, q, q]

    if (courseId) { where += ` AND s.course_id = ${Number(courseId)}` }
    if (batchId) { where += ` AND s.batch_id = ${Number(batchId)}` }

    return getDb().prepare(
      `SELECT s.*, b.name as batch_name, b.status as batch_status,
              c.name as course_name
       FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE ${where} AND (s.name LIKE ? OR s.student_id LIKE ? OR s.phone LIKE ?)
       ORDER BY s.created_at DESC`
    ).all(params)
  })

  ipcMain.handle('students:get', (_e, id) => {
    return getDb().prepare(
      `SELECT s.*, b.name as batch_name, b.status as batch_status, c.name as course_name
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
    const today = localDate()
    const info = getDb().prepare(
      `INSERT INTO students (student_id, name, phone, parent_name, parent_phone, email, address,
        batch_id, course_id, fee_type, fee_structure, fee_amount, discount,
        due_date_type, due_date_day, join_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      studentId, data.name, data.phone || null, data.parent_name || null, data.parent_phone || null,
      data.email || null, data.address || null,
      data.batch_id || null, data.course_id || null,
      data.fee_type || 'monthly', data.fee_structure || 'flat',
      data.fee_amount || 0, data.discount || 0,
      data.due_date_type || 'joining_date', data.due_date_day || 1,
      data.join_date || today
    )
    return { id: info.lastInsertRowid, student_id: studentId }
  })

  ipcMain.handle('students:update', (_e, id, data) => {
    getDb().prepare(
      `UPDATE students SET name=?, phone=?, parent_name=?, parent_phone=?,
        email=?, address=?, batch_id=?, course_id=?, fee_type=?, fee_structure=?,
        fee_amount=?, discount=?, due_date_type=?, due_date_day=?
       WHERE id=?`
    ).run(
      data.name, data.phone || null, data.parent_name || null, data.parent_phone || null,
      data.email || null, data.address || null,
      data.batch_id || null, data.course_id || null,
      data.fee_type || 'monthly', data.fee_structure || 'flat',
      data.fee_amount || 0, data.discount || 0,
      data.due_date_type || 'joining_date', data.due_date_day || 1,
      id
    )
    return { ok: true }
  })

  ipcMain.handle('students:deactivate', (_e, id) => {
    getDb().prepare('UPDATE students SET is_active = 0 WHERE id = ?').run(id)
    return { ok: true }
  })

  ipcMain.handle('students:due', (_e, studentId) => {
    return calcDue(studentId)
  })

  ipcMain.handle('students:dues-list', () => {
    const db = getDb()
    const actives = db.prepare(
      `SELECT s.id FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.is_active = 1 AND (b.status = 'active' OR b.status IS NULL OR s.batch_id IS NULL)`
    ).all() as { id: number }[]

    return actives
      .map((r) => {
        const due = calcDue(r.id)
        if (due.due_amount <= 0) return null
        const s = db.prepare(
          `SELECT s.*, b.name as batch_name, c.name as course_name
           FROM students s
           LEFT JOIN batches b ON s.batch_id = b.id
           LEFT JOIN courses c ON s.course_id = c.id
           WHERE s.id = ?`
        ).get(r.id) as any
        return { ...s, ...due }
      })
      .filter(Boolean)
  })

  // ─── Courses ──────────────────────────────────────────────────────────────
  ipcMain.handle('courses:list', () => {
    return getDb().prepare('SELECT * FROM courses WHERE is_active = 1 ORDER BY name').all()
  })

  ipcMain.handle('courses:create', (_e, data) => {
    const info = getDb().prepare(
      'INSERT INTO courses (name, description, fee_monthly, fee_quarterly, fee_yearly) VALUES (?,?,?,?,?)'
    ).run(data.name, data.description, data.fee_monthly, data.fee_quarterly, data.fee_yearly)
    return { id: info.lastInsertRowid }
  })

  // ─── Batches ──────────────────────────────────────────────────────────────
  ipcMain.handle('batches:list', (_e, includeCompleted = false) => {
    const where = includeCompleted ? '1=1' : "b.status != 'completed'"
    return getDb().prepare(
      `SELECT b.*, c.name as course_name FROM batches b
       LEFT JOIN courses c ON b.course_id = c.id
       WHERE b.is_active = 1 AND ${where} ORDER BY b.name`
    ).all()
  })

  ipcMain.handle('batches:create', (_e, data) => {
    const info = getDb().prepare(
      'INSERT INTO batches (name, course_id, timing, teacher, capacity) VALUES (?,?,?,?,?)'
    ).run(data.name, data.course_id || null, data.timing || null, data.teacher || null, data.capacity || 30)
    return { id: info.lastInsertRowid }
  })

  ipcMain.handle('batches:complete', (_e, id) => {
    const today = localDate()
    getDb().prepare("UPDATE batches SET status = 'completed', completed_date = ? WHERE id = ?")
      .run(today, id)
    // Deactivate all students in this batch
    getDb().prepare("UPDATE students SET is_active = 0 WHERE batch_id = ?").run(id)
    return { ok: true }
  })

  ipcMain.handle('batches:reactivate', (_e, id) => {
    getDb().prepare("UPDATE batches SET status = 'active', completed_date = NULL WHERE id = ?").run(id)
    getDb().prepare("UPDATE students SET is_active = 1 WHERE batch_id = ?").run(id)
    return { ok: true }
  })

  // ─── Fees ─────────────────────────────────────────────────────────────────
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
      data.payment_date || localDate(),
      data.period_from || null, data.period_to || null,
      data.payment_mode || 'cash', data.notes || null
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

  // ─── Reports ──────────────────────────────────────────────────────────────
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
    const today = localDate()
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
    const dueCount = (getDb().prepare(
      `SELECT COUNT(DISTINCT s.id) as c FROM students s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.is_active = 1 AND (b.status = 'active' OR b.status IS NULL OR s.batch_id IS NULL)`
    ).get() as { c: number }).c
    return { today_total: todayTotal, month_total: monthTotal, total_students: totalStudents, due_student_count: dueCount }
  })

  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:data-path', () => app.getPath('userData'))
}
