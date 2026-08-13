import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { listAdminUsers, listRoles } from './db'
import { ensureInitialPasswords } from './db'
import { login, logout, requireAuth, requirePermission, setSession } from './auth'

const app = new Hono()

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>()
  if (!body.email || !body.password) return c.json({ error: 'Email dan password wajib diisi' }, 400)
  const sessionId = await login(body.email, body.password)
  if (!sessionId) return c.json({ error: 'Email atau password salah' }, 401)
  setSession(c, sessionId)
  return c.json({ message: 'Login berhasil' })
})
app.post('/api/auth/logout', requireAuth, (c) => { logout(c); return c.json({ message: 'Logout berhasil' }) })
app.get('/api/auth/me', requireAuth, (c) => c.json({ data: c.get('user') }))
app.get('/api/admin/users', requireAuth, requirePermission('users:read'), (c) => c.json({ data: listAdminUsers() }))
app.get('/api/admin/roles', requireAuth, requirePermission('users:read'), (c) => c.json({ data: listRoles() }))
app.get('/admin.html', requireAuth, (c) => c.redirect('/admin'))
app.get('/admin', requireAuth, async (c) => c.html(await Bun.file('./public/admin.html').text()))
app.use('/*', serveStatic({ root: './public' }))
app.get('/', serveStatic({ path: './public/index.html' }))
app.get('/profil', serveStatic({ path: './public/profil.html' }))

await ensureInitialPasswords()

export default {
  port: Number(Bun.env.PORT || 3000),
  fetch: app.fetch,
}

console.log(`SMPN 4 Majenang berjalan di http://localhost:${Bun.env.PORT || 3000}`)
