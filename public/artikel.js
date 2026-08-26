const params = new URLSearchParams(window.location.search)
const postId = Number(params.get('id'))

const categoryEl = document.querySelector('#article-category')
const titleEl = document.querySelector('#article-title')
const metaEl = document.querySelector('#article-meta')
const imageEl = document.querySelector('#article-image')
const excerptEl = document.querySelector('#article-excerpt')
const contentEl = document.querySelector('#article-content')

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char])

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(String(value).replace(' ', 'T') + 'Z')

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function showError(message) {
  categoryEl.textContent = 'ARTIKEL'
  titleEl.textContent = 'Artikel tidak ditemukan'
  metaEl.textContent = ''
  contentEl.innerHTML = `<p>${escapeHtml(message)}</p>`
}

async function loadArticle() {
  if (!Number.isInteger(postId) || postId <= 0) {
    showError('ID artikel tidak valid.')
    return
  }

  try {
    const response = await fetch(`/api/public/posts/${postId}`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Artikel tidak ditemukan.')
    }

    const post = result.data

    document.title = `${post.title} — SMPN 4 Majenang`

    categoryEl.textContent = String(post.category || (post.type === 'blog' ? 'BLOG' : 'BERITA')).toUpperCase()

    titleEl.textContent = post.title

    metaEl.textContent = [
      post.author_name ? `Oleh ${post.author_name}` : '',
      post.updated_at ? formatDate(post.updated_at) : '',
    ].filter(Boolean).join(' · ')

    if (post.image_url) {
      imageEl.src = post.image_url
      imageEl.alt = post.title
      imageEl.hidden = false
    }

    if (post.excerpt) {
      excerptEl.textContent = post.excerpt
      excerptEl.hidden = false
    }

    if (post.content?.trim()) {
      contentEl.innerHTML = post.content
        .split(/\n{2,}/)
        .map((paragraph) => {
          const lines = paragraph.split(/\n/)
          const isUnordered = lines.every((line) => /^\s*•\s+/.test(line))
          const isOrdered = lines.every((line) => /^\s*\d+\.\s+/.test(line))

          if (isUnordered) {
            return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\s*•\s+/, ''))}</li>`).join('')}</ul>`
          }

          if (isOrdered) {
            return `<ol>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('')}</ol>`
          }

          return `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`
        })
        .join('')
    } else if (post.excerpt?.trim()) {
      contentEl.innerHTML = `<p>${escapeHtml(post.excerpt)}</p>`
    } else {
      contentEl.innerHTML = '<p>Isi artikel belum tersedia.</p>'
    }
  } catch (error) {
    console.error('Gagal memuat artikel:', error)
    showError(error instanceof Error ? error.message : 'Artikel gagal dimuat.')
  }
}

loadArticle()

document.querySelector('.current-year')?.replaceChildren(
  document.createTextNode(String(new Date().getFullYear()))
)
