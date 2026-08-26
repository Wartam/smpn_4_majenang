import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import sharp from 'sharp'
import { countVisitorFeedback, createAdminUser, createMessage, createPost, createVisitorFeedback, deleteAdminUser, deleteMessage, deletePost, deleteVisitorFeedback, getPublishedPost, getSchoolProfile, listAdminUsers, listMessages, listPosts, listPublishedPosts, listRoles, listVisitorFeedback, markMessageRead, markVisitorFeedbackRead, updateAdminUser, updatePost, updateSchoolProfile } from './db'
import { ensureInitialPasswords } from './db'
import { login, logout, requireAuth, requirePermission, setSession } from './auth'

const app = new Hono()

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const TARGET_IMAGE_SIZE = 100 * 1024

async function processPostImage(imageUrl?: string) {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('/')) return imageUrl
  if (!imageUrl.startsWith('data:image/')) throw new Error('Format gambar tidak valid')

  const separator = imageUrl.indexOf(',')
  if (separator < 0) throw new Error('Data gambar tidak valid')

  const encoded = imageUrl.slice(separator + 1)
  const input = Buffer.from(encoded, 'base64')

  if (!input.length || input.length > MAX_UPLOAD_SIZE) {
    throw new Error('Ukuran gambar maksimal 10 MB')
  }

  let best: Buffer | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const width of [1600, 1280, 1024, 800]) {
    for (const quality of [88, 78, 68, 58, 48, 38, 28]) {
      const output = await sharp(input)
        .rotate()
        .resize({
          width,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality,
          effort: 4,
        })
        .toBuffer()

      const distance = Math.abs(output.length - TARGET_IMAGE_SIZE)

      if (distance < bestDistance) {
        best = output
        bestDistance = distance
      }

      if (output.length <= TARGET_IMAGE_SIZE && width <= 1024) break
    }

    if (best && best.length <= TARGET_IMAGE_SIZE && width <= 1024) break
  }

  if (!best) throw new Error('Gambar tidak dapat diproses')

  const filename = `post-${Date.now()}-${crypto.randomUUID()}.webp`
  const filePath = `./public/uploads/posts/${filename}`

  await Bun.write(filePath, best)

  return `/uploads/posts/${filename}`
}
app.onError((error, c) => {
  console.error(error)
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'Terjadi kesalahan server. Silakan coba lagi.' }, 500)
  return c.text('Terjadi kesalahan server.', 500)
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>()
  if (!body.email || !body.password) return c.json({ error: 'Email dan password wajib diisi' }, 400)
  const sessionId = await login(body.email, body.password)
  if (!sessionId) return c.json({ error: 'Email atau password salah' }, 401)
  setSession(c, sessionId)
  return c.json({ message: 'Login berhasil' })
})
app.get('/api/public/profile', (c) => c.json({ data: getSchoolProfile() }))
app.post('/api/public/messages', async (c) => {
  const body = await c.req.json<{ name?: string; contact?: string; message?: string }>()
  if (!body.name?.trim() || !body.contact?.trim() || !body.message?.trim()) return c.json({ error: 'Nama, kontak, dan pesan wajib diisi' }, 400)
  if (body.message.trim().length < 10) return c.json({ error: 'Pesan terlalu singkat' }, 400)
  return c.json({ data: createMessage(body.name.trim(), body.contact.trim(), body.message.trim()) }, 201)
})
app.get('/api/public/feedback/stats', (c) => c.json({ data: { count: countVisitorFeedback() } }))
app.post('/api/public/feedback', async (c) => {
  const body = await c.req.json<{ name?: string; contact?: string; type?: string; message?: string }>()
  if (!body.name?.trim() || !body.message?.trim()) return c.json({ error: 'Nama dan masukan wajib diisi' }, 400)
  if (!['comment', 'suggestion', 'feedback'].includes(body.type || '')) return c.json({ error: 'Jenis masukan tidak valid' }, 400)
  if (body.message.trim().length < 10) return c.json({ error: 'Masukan terlalu singkat' }, 400)
  return c.json({ data: createVisitorFeedback(body.name.trim(), body.contact?.trim() || '', body.type as 'comment' | 'suggestion' | 'feedback', body.message.trim()) }, 201)
})
app.post('/api/auth/logout', requireAuth, (c) => { logout(c); return c.json({ message: 'Logout berhasil' }) })
app.get('/api/auth/me', requireAuth, (c) => c.json({ data: (c as any).get('user') }))
app.get('/api/admin/users', requireAuth, requirePermission('users:read'), (c) => c.json({ data: listAdminUsers() }))
app.post('/api/admin/users', requireAuth, requirePermission('users:create'), async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; role?: string; status?: string; password?: string }>()
  if (!body.name?.trim() || !body.email?.trim() || !body.role || !body.password) return c.json({ error: 'Nama, email, role, dan password wajib diisi' }, 400)
  if (!['owner', 'editor', 'academic', 'contact'].includes(body.role) || !['active', 'pending'].includes(body.status || 'active')) return c.json({ error: 'Role atau status tidak valid' }, 400)
  if (body.password.length < 8) return c.json({ error: 'Password minimal 8 karakter' }, 400)
  try {
    const user = createAdminUser({ name: body.name.trim(), email: body.email.trim(), initials: body.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), role: body.role, status: (body.status as 'active' | 'pending') || 'active', passwordHash: await Bun.password.hash(body.password, { algorithm: 'argon2id' }) })
    return c.json({ data: user }, 201)
  } catch {
    return c.json({ error: 'Email admin sudah digunakan' }, 409)
  }
})
app.put('/api/admin/users/:id', requireAuth, requirePermission('users:update'), async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ name?: string; email?: string; role?: string; status?: string; password?: string }>()
  if (!Number.isInteger(id) || !body.name?.trim() || !body.email?.trim() || !body.role || !['owner', 'editor', 'academic', 'contact'].includes(body.role) || !['active', 'pending'].includes(body.status || 'active')) return c.json({ error: 'Data admin tidak valid' }, 400)
  if (body.password && body.password.length < 8) return c.json({ error: 'Password minimal 8 karakter' }, 400)
  try {
    const user = updateAdminUser(id, { name: body.name.trim(), email: body.email.trim(), initials: body.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(), role: body.role, status: body.status as 'active' | 'pending', passwordHash: body.password ? await Bun.password.hash(body.password, { algorithm: 'argon2id' }) : undefined })
    return user ? c.json({ data: user }) : c.json({ error: 'Admin tidak ditemukan' }, 404)
  } catch {
    return c.json({ error: 'Email admin sudah digunakan' }, 409)
  }
})
app.delete('/api/admin/users/:id', requireAuth, requirePermission('users:delete'), (c) => deleteAdminUser(Number(c.req.param('id'))) ? c.json({ message: 'Admin dihapus' }) : c.json({ error: 'Admin utama tidak dapat dihapus atau data tidak ditemukan' }, 400))
app.get('/api/admin/roles', requireAuth, requirePermission('users:read'), (c) => c.json({ data: listRoles() }))
app.get('/api/admin/profile', requireAuth, requirePermission('profile:read'), (c) => c.json({ data: getSchoolProfile() }))
app.put('/api/admin/profile', requireAuth, requirePermission('profile:update'), async (c) => {
  const body = await c.req.json<Record<string, string>>()
  const required = ['schoolName', 'tagline', 'address', 'phone', 'email', 'foundedYear', 'students', 'teachers', 'classrooms', 'vision', 'mission']
  if (required.some((key) => !body[key]?.trim())) return c.json({ error: 'Semua data profil wajib diisi' }, 400)
  const numbers = ['foundedYear', 'students', 'teachers', 'classrooms'].map((key) => Number(body[key]))
  if (numbers.some((value) => !Number.isInteger(value) || value < 0)) return c.json({ error: 'Data angka profil tidak valid' }, 400)
  const current = getSchoolProfile() as { history?: string; organization?: string; facilities?: string; principal_message?: string } | null
  return c.json({ data: updateSchoolProfile({ schoolName: body.schoolName.trim(), tagline: body.tagline.trim(), address: body.address.trim(), phone: body.phone.trim(), email: body.email.trim(), foundedYear: numbers[0], students: numbers[1], teachers: numbers[2], classrooms: numbers[3], vision: body.vision.trim(), mission: body.mission.trim(), history: body.history?.trim() || current?.history || '', organization: body.organization?.trim() || current?.organization || '', facilities: body.facilities?.trim() || current?.facilities || '', principalMessage: body.principalMessage?.trim() || current?.principal_message || '' }) })
})
app.get('/api/admin/messages', requireAuth, requirePermission('messages:read'), (c) => c.json({ data: listMessages() }))
app.put('/api/admin/messages/:id/read', requireAuth, requirePermission('messages:update'), (c) => markMessageRead(Number(c.req.param('id'))) ? c.json({ message: 'Pesan ditandai sudah dibaca' }) : c.json({ error: 'Pesan tidak ditemukan' }, 404))
app.delete('/api/admin/messages/:id', requireAuth, requirePermission('messages:delete'), (c) => deleteMessage(Number(c.req.param('id'))) ? c.json({ message: 'Pesan dihapus' }) : c.json({ error: 'Pesan tidak ditemukan' }, 404))
app.get('/api/admin/visitors', requireAuth, requirePermission('messages:read'), (c) => c.json({ data: listVisitorFeedback() }))
app.put('/api/admin/visitors/:id/read', requireAuth, requirePermission('messages:update'), (c) => markVisitorFeedbackRead(Number(c.req.param('id'))) ? c.json({ message: 'Masukan ditandai sudah dibaca' }) : c.json({ error: 'Masukan tidak ditemukan' }, 404))
app.delete('/api/admin/visitors/:id', requireAuth, requirePermission('messages:delete'), (c) => deleteVisitorFeedback(Number(c.req.param('id'))) ? c.json({ message: 'Masukan dihapus' }) : c.json({ error: 'Masukan tidak ditemukan' }, 404))
app.get('/api/public/posts', (c) => {
  return c.json({ data: listPublishedPosts(c.req.query('type')) })
})
app.get('/api/public/posts/:id', (c) => {
  const id = Number(c.req.param('id'))

  if (!Number.isInteger(id)) {
    return c.json({ error: 'ID konten tidak valid' }, 400)
  }

  const post = getPublishedPost(id)

  if (!post) {
    return c.json({ error: 'Konten tidak ditemukan' }, 404)
  }

  return c.json({ data: post })
})
app.get('/api/admin/posts', requireAuth, requirePermission('content:read'), (c) => c.json({ data: listPosts(c.req.query('type')) }))
app.post('/api/admin/posts', requireAuth, requirePermission('content:create'), async (c) => {
  const body = await c.req.json<{ type?: string; title?: string; excerpt?: string; content?: string; imageUrl?: string; category?: string; status?: string }>()
  if (!['news', 'blog'].includes(body.type || '') || !body.title?.trim()) return c.json({ error: 'Jenis konten dan judul wajib diisi' }, 400)
  if (body.status && !['draft', 'published'].includes(body.status)) return c.json({ error: 'Status konten tidak valid' }, 400)
  let imageUrl = ''
  try {
    imageUrl = await processPostImage(body.imageUrl)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Gambar gagal diproses' }, 400)
  }
  const user = (c as any).get('user') as { id: number }
  const post = createPost({ type: body.type as 'news' | 'blog', title: body.title.trim(), excerpt: body.excerpt?.trim() || '', content: body.content?.trim() || '', imageUrl, category: body.category?.trim() || 'Umum', status: (body.status as 'draft' | 'published') || 'draft', authorId: user.id })
  return c.json({ data: post }, 201)
})
app.put('/api/admin/posts/:id', requireAuth, requirePermission('content:update'), async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ type?: string; title?: string; excerpt?: string; content?: string; imageUrl?: string; category?: string; status?: string }>()
  if (!Number.isInteger(id) || !['news', 'blog'].includes(body.type || '') || !body.title?.trim()) return c.json({ error: 'Data konten tidak valid' }, 400)
  if (body.status && !['draft', 'published'].includes(body.status)) return c.json({ error: 'Status konten tidak valid' }, 400)
  let imageUrl = ''
  try {
    imageUrl = await processPostImage(body.imageUrl)
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Gambar gagal diproses' }, 400)
  }
  const post = updatePost(id, { type: body.type as 'news' | 'blog', title: body.title.trim(), excerpt: body.excerpt?.trim() || '', content: body.content?.trim() || '', imageUrl, category: body.category?.trim() || 'Umum', status: (body.status as 'draft' | 'published') || 'draft' })
  return post ? c.json({ data: post }) : c.json({ error: 'Konten tidak ditemukan' }, 404)
})
app.delete('/api/admin/posts/:id', requireAuth, requirePermission('content:delete'), (c) => deletePost(Number(c.req.param('id'))) ? c.json({ message: 'Konten dihapus' }) : c.json({ error: 'Konten tidak ditemukan' }, 404))
app.get('/admin.html', requireAuth, (c) => c.redirect('/admin'))
app.get('/admin', requireAuth, async (c) => c.html(await Bun.file('./public/admin.html').text()))
app.get('/admin/konten', requireAuth, async (c) => c.html(await Bun.file('./public/content.html').text()))
app.get('/admin/pengguna', requireAuth, async (c) => c.html(await Bun.file('./public/users.html').text()))
app.get('/admin/profil', requireAuth, async (c) => c.html(await Bun.file('./public/school-profile.html').text()))
app.get('/admin/pesan', requireAuth, async (c) => c.html(await Bun.file('./public/messages.html').text()))
app.get('/admin/pengunjung', requireAuth, async (c) => c.html(await Bun.file('./public/visitors.html').text()))
for (const path of ['/profil/sambutan', '/profil/sejarah', '/profil/visi-misi', '/profil/struktur', '/profil/sarpras']) {
  app.get(path, async (c) => c.html(await Bun.file('./public/profile-section.html').text()))
}
app.use('/*', serveStatic({ root: './public' }))
app.get('/', serveStatic({ path: './public/index.html' }))
app.get('/profil', serveStatic({ path: './public/profil.html' }))

await ensureInitialPasswords()

export default {
  port: Number(Bun.env.PORT || 3000),
  fetch: app.fetch,
}

console.log(`SMPN 4 Majenang berjalan di http://localhost:${Bun.env.PORT || 3000}`)
