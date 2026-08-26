const toggle = document.querySelector('.menu-toggle')
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {}))
const nav = document.querySelector('.main-nav')
const closeDropdowns = () => document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
  dropdown.classList.remove('open')
  dropdown.querySelector('.nav-dropdown-toggle')?.setAttribute('aria-expanded', 'false')
})
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  toggle.setAttribute('aria-expanded', String(open))
  if (!open) closeDropdowns()
})
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open')
  closeDropdowns()
}))
document.querySelectorAll('.nav-dropdown-toggle').forEach((button) => button.addEventListener('click', () => {
  const dropdown = button.closest('.nav-dropdown')
  const open = dropdown.classList.toggle('open')
  button.setAttribute('aria-expanded', String(open))
}))
const form = document.querySelector('.contact-form:not(.visitor-form)')
form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const status = form.querySelector('.form-status')
  const button = form.querySelector('button[type="submit"]')
  button.disabled = true
  try {
    const response = await fetch('/api/public/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Pesan gagal dikirim')
    status.textContent = 'Terima kasih, pesan Anda sudah kami terima.'
    form.reset()
  } catch (error) {
    status.textContent = error.message
  } finally {
    button.disabled = false
  }
})
const visitorForm = document.querySelector('.visitor-form')
visitorForm?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const status = visitorForm.querySelector('.form-status')
  const button = visitorForm.querySelector('button[type="submit"]')
  button.disabled = true
  try {
    const response = await fetch('/api/public/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(visitorForm))) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Masukan gagal dikirim')
    status.textContent = 'Terima kasih, masukan Anda sudah kami terima.'
    visitorForm.reset()
    const count = document.querySelector('#visitor-count')
    if (count) count.textContent = String(Number(count.textContent || 0) + 1)
  } catch (error) { status.textContent = error.message } finally { button.disabled = false }
})
const links = document.querySelectorAll('.main-nav a')
const sections = document.querySelectorAll('main section[id]')
const focusableSections = document.querySelectorAll('body:not(.profile-page) main section[id]')
function showSectionFromHash(hash = window.location.hash) {
  if (!focusableSections.length) return
  const id = hash.replace(/^#/, '')
  const target = [...focusableSections].find((section) => section.id === id)
  if (id === 'beranda') {
    document.body.classList.remove('section-focus-mode')
    focusableSections.forEach((section) => { section.classList.remove('active-section'); section.hidden = false })
    window.scrollTo({ top: 0, behavior: 'auto' })
    return
  }
  if (!target) {
    document.body.classList.remove('section-focus-mode')
    focusableSections.forEach((section) => { section.classList.remove('active-section'); section.hidden = false })
    return
  }
  document.body.classList.add('section-focus-mode')
  focusableSections.forEach((section) => {
    const active = section === target
    section.classList.toggle('active-section', active)
    section.hidden = !active
  })
  window.scrollTo({ top: 0, behavior: 'auto' })
}
document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  const id = link.getAttribute('href')?.slice(1)
  if (!id || ![...focusableSections].some((section) => section.id === id)) return
  event.preventDefault()
  history.pushState({}, '', `#${id}`)
  showSectionFromHash(`#${id}`)
  nav?.classList.remove('open')
  closeDropdowns()
}))
window.addEventListener('hashchange', () => showSectionFromHash())
window.addEventListener('popstate', () => showSectionFromHash())
showSectionFromHash()
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)) } }), { rootMargin: '-40% 0px -50% 0px' })
sections.forEach((section) => observer.observe(section))

async function loadPublicPosts() {
  const newsContainer = document.querySelector('#public-news')
  const blogContainer = document.querySelector('#public-blog')
  if (!newsContainer && !blogContainer) return

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
  const formatDate = (value) => {
    if (!value) return ''
    const date = new Date(String(value).replace(' ', 'T') + 'Z')
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).toUpperCase()
  }

  try {
    const [newsResponse, blogResponse] = await Promise.all([fetch('/api/public/posts?type=news'), fetch('/api/public/posts?type=blog')])
    if (!newsResponse.ok || !blogResponse.ok) throw new Error('Gagal memuat konten')
    const news = (await newsResponse.json()).data || []
    const blogs = (await blogResponse.json()).data || []
    if (newsContainer) {
      if (!news.length) newsContainer.innerHTML = '<div class="public-empty">Belum ada berita yang diterbitkan.</div>'
      else {
        const featured = news[0]
        const secondary = news.slice(1, 3)
        newsContainer.innerHTML = `<article class="featured-news"><div class="news-visual visual-one ${featured.image_url ? 'has-image' : ''}">${featured.image_url ? `<img src="${escapeHtml(featured.image_url)}" alt="${escapeHtml(featured.title)}" loading="lazy">` : '<span class="visual-emoji">🏆</span>'}<span class="date-badge">${formatDate(featured.updated_at).replace(/ /g, '<br>')}</span></div><div class="article-copy"><span class="category">${escapeHtml(featured.category || 'BERITA')}</span><h3>${escapeHtml(featured.title)}</h3><p>${escapeHtml(featured.excerpt || '')}</p><a href="/artikel.html?id=${featured.id}" class="arrow-link">Baca selengkapnya <span>↗</span></a></div></article><div class="small-news-list">${secondary.map((post, index) => `<article><div class="thumb ${index % 2 === 0 ? 'thumb-blue' : 'thumb-yellow'} ${post.image_url ? 'has-image' : ''}">${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" loading="lazy">` : (index === 0 ? '🌱' : '🎨')}</div><div><span class="category">${escapeHtml(post.category || 'BERITA')} · ${formatDate(post.updated_at)}</span><h3>${escapeHtml(post.title)}</h3><a href="/artikel.html?id=${post.id}">Baca cerita →</a></div></article>`).join('')}</div>`
      }
    }
    if (blogContainer) {
      if (!blogs.length) blogContainer.innerHTML = '<div class="public-empty">Belum ada tulisan blog yang diterbitkan.</div>'
      else blogContainer.innerHTML = blogs.slice(0, 3).map((post, index) => `<article><a href="/artikel.html?id=${post.id}" class="blog-card-link"><div class="blog-image ${post.image_url ? 'has-image' : `blog-image-${index + 1}`}">${post.image_url ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" loading="lazy">` : ['✦', '◎', '⌁'][index]}</div><span class="category">${escapeHtml(post.category || 'BLOG')} · ${formatDate(post.updated_at)}</span><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.excerpt || '')}</p><span class="text-link">Baca selengkapnya ↗</span></a></article>`).join('')
    }
  } catch (error) {
    console.error('Gagal memuat berita/blog:', error)
    if (newsContainer) newsContainer.innerHTML = '<div class="public-empty">Berita belum dapat dimuat.</div>'
    if (blogContainer) blogContainer.innerHTML = '<div class="public-empty">Blog belum dapat dimuat.</div>'
  }
}

loadPublicPosts()
