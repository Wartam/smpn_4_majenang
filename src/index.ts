import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

app.use('/*', serveStatic({ root: './public' }))
app.get('/', serveStatic({ path: './public/index.html' }))

export default {
  port: Number(Bun.env.PORT || 3000),
  fetch: app.fetch,
}

console.log(`SMPN 4 Majenang berjalan di http://localhost:${Bun.env.PORT || 3000}`)
