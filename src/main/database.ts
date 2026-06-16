import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { createHash } from 'crypto'

let db: Database.Database

export function getDb(): Database.Database {
  return db
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(`tbs-salt-2024:${password}`).digest('hex')
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'coaching.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()
}

function runMigrations(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      security_question TEXT,
      security_answer_hash TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS institute (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      logo_path TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      fee_monthly REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      fee_monthly REAL DEFAULT 0,
      fee_quarterly REAL DEFAULT 0,
      fee_yearly REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course_id INTEGER REFERENCES courses(id),
      timing TEXT,
      teacher TEXT,
      capacity INTEGER DEFAULT 30,
      status TEXT DEFAULT 'active',
      completed_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      email TEXT,
      address TEXT,
      photo_path TEXT,
      id_proof_path TEXT,
      batch_id INTEGER REFERENCES batches(id),
      course_id INTEGER REFERENCES courses(id),
      fee_type TEXT DEFAULT 'monthly',
      fee_structure TEXT DEFAULT 'flat',
      fee_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      due_date_type TEXT DEFAULT 'joining_date',
      due_date_day INTEGER DEFAULT 1,
      scholarship TEXT,
      join_date TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS student_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id),
      fee_override REAL,
      UNIQUE(student_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT UNIQUE NOT NULL,
      student_id INTEGER REFERENCES students(id),
      amount REAL NOT NULL,
      discount REAL DEFAULT 0,
      total_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      period_from TEXT,
      period_to TEXT,
      payment_mode TEXT DEFAULT 'cash',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      batch_id INTEGER REFERENCES batches(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'absent',
      edit_comment TEXT,
      edited_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      expense_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `)

  // Safe column additions for existing databases
  const addCol = (table: string, col: string, def: string) => {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`) } catch { /* already exists */ }
  }
  addCol('students', 'fee_structure', "TEXT DEFAULT 'flat'")
  addCol('students', 'due_date_type', "TEXT DEFAULT 'joining_date'")
  addCol('students', 'due_date_day', 'INTEGER DEFAULT 1')
  addCol('batches', 'status', "TEXT DEFAULT 'active'")
  addCol('batches', 'completed_date', 'TEXT')
}
