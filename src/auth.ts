import { createMiddleware } from 'hono/factory'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { db } from './db'

const SESSION_COOKIE = 'smpn4_session'
const SESSION_DAYS = 7

type SessionUser = {
  id: number
  name: string
  email: string
  initials: string
  role: string
  role_label: string
  permissions: string[]
}

function findUserBySession(sessionId?: string): SessionUser | null {
  if (!sessionId) return null
  const user = db.query(`
    SELECT admin_users.id, admin_users.name, admin_users.email, admin_users.initials,
      roles.name AS role, roles.label AS role_label, roles.permissions
    FROM admin_sessions
    JOIN admin_users ON admin_users.id = admin_sessions.user_id
    JOIN roles ON roles.id = admin_users.role_id
    WHERE admin_sessions.id = ? AND admin_sessions.expires_at > ? AND admin_users.status = 'active'
  `).get(sessionId, Date.now()) as (Omit<SessionUser, 'permissions'> & { permissions: string }) | null
  if (!user) return null
  return { ...user, permissions: JSON.parse(user.permissions) }
}

export function currentUser(c: any) {
  return findUserBySession(getCookie(c, SESSION_COOKIE))
}

export const requireAuth: any = createMiddleware((async (c, next) => {
  const user = currentUser(c)
  if (!user) {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'Autentikasi diperlukan' }, 401)
    return c.redirect('/login.html')
  }
  c.set('user', user)
  await next()
}) as any)

export function requirePermission(permission: string) {
  return createMiddleware((async (c, next) => {
    const user = c.get('user') as SessionUser | undefined
    if (!user) return c.json({ error: 'Autentikasi diperlukan' }, 401)
    if (user.role !== 'owner' && !user.permissions.includes('*') && !user.permissions.includes(permission)) {
      return c.json({ error: 'Anda tidak memiliki izin untuk tindakan ini' }, 403)
    }
    await next()
  }) as any)
}

export async function login(email: string, password: string) {
  const user = db.query(`
    SELECT admin_users.id, admin_users.password_hash
    FROM admin_users
    WHERE lower(admin_users.email) = lower(?) AND admin_users.status = 'active'
  `).get(email) as { id: number; password_hash: string | null } | null
  if (!user?.password_hash || !(await Bun.password.verify(password, user.password_hash))) return false

  const sessionId = crypto.randomUUID()
  db.query('INSERT INTO admin_sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, user.id, Date.now() + SESSION_DAYS * 86400000)
  return sessionId
}

export function setSession(c: any, sessionId: string) {
  setCookie(c, SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'Lax', secure: Bun.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_DAYS * 86400 })
}

export function logout(c: any) {
  const sessionId = getCookie(c, SESSION_COOKIE)
  if (sessionId) db.query('DELETE FROM admin_sessions WHERE id = ?').run(sessionId)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}
