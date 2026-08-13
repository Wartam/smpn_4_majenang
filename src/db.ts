import { mkdirSync } from 'node:fs'
import { Database } from 'bun:sqlite'

mkdirSync('./data', { recursive: true })

export const db = new Database('./data/smpn4majenang.sqlite', { create: true })

db.run(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT '[]'
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    initials TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
  )
`)

try {
  db.run('ALTER TABLE admin_users ADD COLUMN password_hash TEXT')
} catch {
  // Column already exists on databases created by a previous version.
}

db.run(`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  )
`)

const roleSeed = db.prepare(`
  INSERT OR IGNORE INTO roles (name, label, description, permissions)
  VALUES (?, ?, ?, ?)
`)

for (const role of [
  ['owner', 'Admin Utama', 'Akses penuh ke seluruh fitur dan pengaturan', ['*']],
  ['editor', 'Admin Konten', 'Mengelola berita, blog, dan media', ['content:read', 'content:create', 'content:update']],
  ['academic', 'Admin Akademik', 'Mengelola profil dan informasi sekolah', ['profile:read', 'profile:update']],
  ['contact', 'Admin Layanan', 'Mengelola pesan dan informasi kontak', ['messages:read', 'messages:update']],
] as const) {
  roleSeed.run(role[0], role[1], role[2], JSON.stringify(role[3]))
}

const userSeed = db.prepare(`
  INSERT OR IGNORE INTO admin_users (name, email, initials, role_id, status)
  VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = ?), ?)
`)

for (const user of [
  ['Admin Utama', 'admin@smpn4majenang.sch.id', 'AR', 'owner', 'active'],
  ['Nadia Fitri', 'nadia@smpn4majenang.sch.id', 'NF', 'editor', 'active'],
  ['Dimas Saputra', 'dimas@smpn4majenang.sch.id', 'DS', 'academic', 'active'],
  ['Lina Wati', 'lina@smpn4majenang.sch.id', 'LW', 'contact', 'pending'],
] as const) {
  userSeed.run(...user)
}

export function listAdminUsers() {
  return db.query(`
    SELECT
      admin_users.id,
      admin_users.name,
      admin_users.email,
      admin_users.initials,
      admin_users.status,
      roles.name AS role,
      roles.label AS role_label,
      roles.description AS role_description,
      roles.permissions
    FROM admin_users
    JOIN roles ON roles.id = admin_users.role_id
    ORDER BY admin_users.id ASC
  `).all().map((user) => ({
    ...user,
    permissions: JSON.parse(String(user.permissions)),
  }))
}

export function listRoles() {
  return db.query('SELECT name, label, description, permissions FROM roles ORDER BY id ASC').all().map((role) => ({
    ...role,
    permissions: JSON.parse(String(role.permissions)),
  }))
}

export async function ensureInitialPasswords() {
  const password = Bun.env.ADMIN_INITIAL_PASSWORD || 'AdminSMPN4!2026'
  const hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
  db.query('UPDATE admin_users SET password_hash = ? WHERE password_hash IS NULL').run(hash)
}
