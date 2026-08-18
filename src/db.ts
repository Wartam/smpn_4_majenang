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

db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('news', 'blog')),
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Umum',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    author_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users(id)
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS school_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    school_name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    founded_year INTEGER NOT NULL,
    students INTEGER NOT NULL,
    teachers INTEGER NOT NULL,
    classrooms INTEGER NOT NULL,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

db.run(`
  INSERT OR IGNORE INTO school_profile (id, school_name, tagline, address, phone, email, founded_year, students, teachers, classrooms, vision, mission)
  VALUES (1, 'SMP Negeri 4 Majenang', 'Melangkah bersama, meraih masa depan.', 'Jl. Raya Majenang–Cilacap, Majenang, Jawa Tengah 53257', '(0280) 621 234', 'info@smpn4majenang.sch.id', 2006, 527, 33, 18, 'Terwujudnya peserta didik yang beriman, berkarakter, berprestasi, berwawasan lingkungan, dan mampu beradaptasi dengan perkembangan zaman.', 'Menyelenggarakan pembelajaran yang aktif, kreatif, dan berpihak pada murid serta membangun budaya sekolah yang ramah, disiplin, dan kolaboratif.')
`)

const roleSeed = db.prepare(`
  INSERT OR IGNORE INTO roles (name, label, description, permissions)
  VALUES (?, ?, ?, ?)
`)

for (const role of [
  ['owner', 'Admin Utama', 'Akses penuh ke seluruh fitur dan pengaturan', ['*']],
  ['editor', 'Admin Konten', 'Mengelola berita, blog, dan media', ['content:read', 'content:create', 'content:update', 'content:delete']],
  ['academic', 'Admin Akademik', 'Mengelola profil dan informasi sekolah', ['profile:read', 'profile:update']],
  ['contact', 'Admin Layanan', 'Mengelola pesan dan informasi kontak', ['messages:read', 'messages:update']],
] as const) {
  roleSeed.run(role[0], role[1], role[2], JSON.stringify(role[3]))
}

const editorRole = db.query('SELECT permissions FROM roles WHERE name = ?').get('editor') as { permissions: string } | null
if (editorRole) {
  const editorPermissions = JSON.parse(editorRole.permissions) as string[]
  if (!editorPermissions.includes('content:delete')) {
    editorPermissions.push('content:delete')
    db.query('UPDATE roles SET permissions = ? WHERE name = ?').run(JSON.stringify(editorPermissions), 'editor')
  }
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

export function createAdminUser(input: { name: string; email: string; initials: string; role: string; status: 'active' | 'pending'; passwordHash: string }) {
  const result = db.query(`INSERT INTO admin_users (name, email, initials, role_id, status, password_hash) VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = ?), ?, ?)`).run(input.name, input.email.toLowerCase(), input.initials, input.role, input.status, input.passwordHash)
  return db.query('SELECT id, name, email, initials, status FROM admin_users WHERE id = ?').get(result.lastInsertRowid)
}

export function updateAdminUser(id: number, input: { name: string; email: string; initials: string; role: string; status: 'active' | 'pending'; passwordHash?: string }) {
  if (input.passwordHash) {
    db.query(`UPDATE admin_users SET name = ?, email = ?, initials = ?, role_id = (SELECT id FROM roles WHERE name = ?), status = ?, password_hash = ? WHERE id = ?`).run(input.name, input.email.toLowerCase(), input.initials, input.role, input.status, input.passwordHash, id)
  } else {
    db.query(`UPDATE admin_users SET name = ?, email = ?, initials = ?, role_id = (SELECT id FROM roles WHERE name = ?), status = ? WHERE id = ?`).run(input.name, input.email.toLowerCase(), input.initials, input.role, input.status, id)
  }
  return db.query('SELECT id, name, email, initials, status FROM admin_users WHERE id = ?').get(id)
}

export function deleteAdminUser(id: number) {
  return db.query(`DELETE FROM admin_users WHERE id = ? AND (SELECT name FROM roles WHERE id = admin_users.role_id) != 'owner'`).run(id).changes > 0
}

export function getSchoolProfile() {
  return db.query('SELECT * FROM school_profile WHERE id = 1').get()
}

export function updateSchoolProfile(input: { schoolName: string; tagline: string; address: string; phone: string; email: string; foundedYear: number; students: number; teachers: number; classrooms: number; vision: string; mission: string }) {
  db.query(`UPDATE school_profile SET school_name = ?, tagline = ?, address = ?, phone = ?, email = ?, founded_year = ?, students = ?, teachers = ?, classrooms = ?, vision = ?, mission = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`).run(input.schoolName, input.tagline, input.address, input.phone, input.email, input.foundedYear, input.students, input.teachers, input.classrooms, input.vision, input.mission)
  return getSchoolProfile()
}

export function listMessages() {
  return db.query('SELECT * FROM contact_messages ORDER BY CASE status WHEN \'unread\' THEN 0 ELSE 1 END, created_at DESC').all()
}

export function createMessage(name: string, contact: string, message: string) {
  const result = db.query('INSERT INTO contact_messages (name, contact, message) VALUES (?, ?, ?)').run(name, contact, message)
  return db.query('SELECT * FROM contact_messages WHERE id = ?').get(result.lastInsertRowid)
}

export function markMessageRead(id: number) {
  return db.query("UPDATE contact_messages SET status = 'read' WHERE id = ?").run(id).changes > 0
}

export function deleteMessage(id: number) {
  return db.query('DELETE FROM contact_messages WHERE id = ?').run(id).changes > 0
}

export function listRoles() {
  return db.query('SELECT name, label, description, permissions FROM roles ORDER BY id ASC').all().map((role) => ({
    ...role,
    permissions: JSON.parse(String(role.permissions)),
  }))
}

export function listPosts(type?: string) {
  const query = type === 'news' || type === 'blog'
    ? db.query(`SELECT posts.*, admin_users.name AS author_name FROM posts LEFT JOIN admin_users ON admin_users.id = posts.author_id WHERE posts.type = ? ORDER BY posts.updated_at DESC`)
    : db.query(`SELECT posts.*, admin_users.name AS author_name FROM posts LEFT JOIN admin_users ON admin_users.id = posts.author_id ORDER BY posts.updated_at DESC`)
  return (type === 'news' || type === 'blog' ? query.all(type) : query.all())
}

export function createPost(input: { type: 'news' | 'blog'; title: string; excerpt: string; category: string; status: 'draft' | 'published'; authorId: number }) {
  const result = db.query(`INSERT INTO posts (type, title, excerpt, category, status, author_id) VALUES (?, ?, ?, ?, ?, ?)`).run(input.type, input.title, input.excerpt, input.category, input.status, input.authorId)
  return db.query('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid)
}

export function updatePost(id: number, input: { type: 'news' | 'blog'; title: string; excerpt: string; category: string; status: 'draft' | 'published' }) {
  db.query(`UPDATE posts SET type = ?, title = ?, excerpt = ?, category = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(input.type, input.title, input.excerpt, input.category, input.status, id)
  return db.query('SELECT * FROM posts WHERE id = ?').get(id)
}

export function deletePost(id: number) {
  return db.query('DELETE FROM posts WHERE id = ?').run(id).changes > 0
}

const postCount = db.query('SELECT COUNT(*) AS count FROM posts').get() as { count: number }
if (postCount.count === 0) {
  const postSeed = db.prepare(`INSERT INTO posts (type, title, excerpt, category, status, author_id) VALUES (?, ?, ?, ?, ?, (SELECT id FROM admin_users WHERE email = ?))`)
  postSeed.run('news', 'Tim Olimpiade Sains Raih Juara Kabupaten', 'Perjalanan membanggakan siswa-siswi terbaik kami dalam kompetisi sains tahun ini.', 'Prestasi', 'published', 'admin@smpn4majenang.sch.id')
  postSeed.run('news', 'Gerakan Satu Siswa Satu Tanaman', 'Menumbuhkan kepedulian terhadap lingkungan dari kebiasaan sederhana.', 'Lingkungan', 'published', 'admin@smpn4majenang.sch.id')
  postSeed.run('blog', 'Belajar bukan tentang menjadi paling pintar', 'Memaknai proses belajar sebagai perjalanan untuk terus bertumbuh.', 'Pendidikan', 'published', 'admin@smpn4majenang.sch.id')
}

export async function ensureInitialPasswords() {
  const password = Bun.env.ADMIN_INITIAL_PASSWORD || 'AdminSMPN4!2026'
  const hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
  db.query('UPDATE admin_users SET password_hash = ? WHERE password_hash IS NULL').run(hash)
}
