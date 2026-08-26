const list = document.querySelector('#post-list')
fetch('/api/auth/me').then((response) => response.ok ? response.json() : null).then((result) => { if (result?.data) document.querySelector('.top-avatar').textContent = result.data.initials }).catch(() => {})
const modal = document.querySelector('#post-modal')
const form = document.querySelector('#post-form')
const error = document.querySelector('#form-error')
let posts = []
let filter = 'all'
let editingId = null
let imageData = ''

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
const dateLabel = (value) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(String(value).replace(' ', 'T') + 'Z'))
const showToast = (message) => { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2300) }
const imageInput = form.elements.image
const imagePreview = document.querySelector('#image-preview')
const contentInput = form.elements.content

function setImagePreview(value) {
  imageData = value || ''
  imagePreview.src = imageData
  imagePreview.hidden = !imageData
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0]
  if (!file) return setImagePreview('')
  if (file.size > 10 * 1024 * 1024) {
    imageInput.value = ''
    setImagePreview('')
    error.textContent = 'Ukuran gambar maksimal 10 MB'
    return
  }
  const reader = new FileReader()
  reader.addEventListener('load', () => setImagePreview(String(reader.result || '')))
  reader.readAsDataURL(file)
})

document.querySelectorAll('[data-list]').forEach((button) => button.addEventListener('click', () => {
  const ordered = button.dataset.list === 'ordered'
  const start = contentInput.selectionStart
  const end = contentInput.selectionEnd
  const selected = contentInput.value.slice(start, end)
  const lines = (selected || 'Tulis item di sini').split(/\r?\n/)
  const markup = lines.map((line, index) => `${ordered ? `${index + 1}.` : '•'} ${line.replace(/^\s*(?:•|\d+\.)\s*/, '')}`).join('\n')
  contentInput.setRangeText(markup, start, end, 'select')
  contentInput.focus()
}))

function renderPosts() {
  const search = document.querySelector('#search').value.toLowerCase()
  const visible = posts.filter((post) => (filter === 'all' || post.type === filter) && post.title.toLowerCase().includes(search))
  if (!visible.length) { list.innerHTML = '<div class="empty-state">Belum ada konten yang sesuai.</div>'; return }
  list.innerHTML = `<div class="post-row post-head"><span>Judul konten</span><span>Jenis</span><span>Status</span><span>Diperbarui</span><span></span></div>` + visible.map((post) => `<div class="post-row"><span class="post-title"><i class="post-icon ${post.type}">${post.type === 'news' ? '▤' : '✦'}</i><b>${escapeHtml(post.title)}<small>${escapeHtml(post.category)} · ${escapeHtml(post.author_name || 'Admin')}</small></b></span><span><em class="type-badge ${post.type}">${post.type === 'news' ? 'Berita' : 'Blog'}</em></span><span><em class="status ${post.status === 'published' ? 'active' : 'pending'}">${post.status === 'published' ? 'Terbit' : 'Draft'}</em></span><span class="post-date">${dateLabel(post.updated_at)}</span><span class="post-actions"><button data-edit="${post.id}" title="Edit">✎</button><button data-delete="${post.id}" title="Hapus">×</button></span></div>`).join('')
  list.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openForm(posts.find((post) => post.id === Number(button.dataset.edit)))))
  list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => removePost(Number(button.dataset.delete))))
}

async function loadPosts() { const response = await fetch('/api/admin/posts'); if (response.status === 401) return window.location.href = '/login.html'; if (response.status === 403) throw new Error('Akun ini tidak memiliki izin mengelola konten. Gunakan Admin Konten atau Admin Utama.'); if (!response.ok) throw new Error('Gagal memuat konten'); posts = (await response.json()).data; renderPosts() }
function openForm(post) { editingId = post?.id || null; form.reset(); form.elements.id.value = post?.id || ''; form.elements.type.value = post?.type || 'news'; form.elements.title.value = post?.title || ''; form.elements.category.value = post?.category || ''; form.elements.excerpt.value = post?.excerpt || ''; form.elements.content.value = post?.content || ''; form.elements.status.value = post?.status || 'draft'; setImagePreview(post?.image_url || ''); document.querySelector('#form-title').textContent = post ? 'Edit konten' : 'Buat konten baru'; error.textContent = ''; modal.hidden = false }
function closeForm() { modal.hidden = true; editingId = null }
async function removePost(id) { if (!confirm('Hapus konten ini?')) return; const response = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }); if (!response.ok) return showToast('Anda tidak memiliki izin menghapus konten'); posts = posts.filter((post) => post.id !== id); renderPosts(); showToast('Konten berhasil dihapus') }

document.querySelector('#new-post').addEventListener('click', () => openForm())
document.querySelector('#close-modal').addEventListener('click', closeForm)
document.querySelector('#cancel-form').addEventListener('click', closeForm)
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); filter = tab.dataset.filter; renderPosts() }))
document.querySelector('#search').addEventListener('input', renderPosts)
form.addEventListener('submit', async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); values.imageUrl = imageData; delete values.image; const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts'; try { const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const result = await response.json(); if (!response.ok) { error.textContent = result.error || 'Gagal menyimpan konten'; return } closeForm(); await loadPosts(); showToast('Konten berhasil disimpan') } catch (exception) { error.textContent = exception.message || 'Server tidak dapat dihubungi' } })
loadPosts().catch((exception) => { list.innerHTML = `<div class="empty-state">${escapeHtml(exception.message || 'Gagal memuat konten.')}</div>` })
