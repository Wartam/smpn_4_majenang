const list = document.querySelector('#post-list')
const modal = document.querySelector('#post-modal')
const form = document.querySelector('#post-form')
const error = document.querySelector('#form-error')
let posts = []
let filter = 'all'
let editingId = null

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
const dateLabel = (value) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(String(value).replace(' ', 'T') + 'Z'))
const showToast = (message) => { const toast = document.querySelector('.toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2300) }

function renderPosts() {
  const search = document.querySelector('#search').value.toLowerCase()
  const visible = posts.filter((post) => (filter === 'all' || post.type === filter) && post.title.toLowerCase().includes(search))
  if (!visible.length) { list.innerHTML = '<div class="empty-state">Belum ada konten yang sesuai.</div>'; return }
  list.innerHTML = `<div class="post-row post-head"><span>Judul konten</span><span>Jenis</span><span>Status</span><span>Diperbarui</span><span></span></div>` + visible.map((post) => `<div class="post-row"><span class="post-title"><i class="post-icon ${post.type}">${post.type === 'news' ? '▤' : '✦'}</i><b>${escapeHtml(post.title)}<small>${escapeHtml(post.category)} · ${escapeHtml(post.author_name || 'Admin')}</small></b></span><span><em class="type-badge ${post.type}">${post.type === 'news' ? 'Berita' : 'Blog'}</em></span><span><em class="status ${post.status === 'published' ? 'active' : 'pending'}">${post.status === 'published' ? 'Terbit' : 'Draft'}</em></span><span class="post-date">${dateLabel(post.updated_at)}</span><span class="post-actions"><button data-edit="${post.id}" title="Edit">✎</button><button data-delete="${post.id}" title="Hapus">×</button></span></div>`).join('')
  list.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openForm(posts.find((post) => post.id === Number(button.dataset.edit)))))
  list.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => removePost(Number(button.dataset.delete))))
}

async function loadPosts() { const response = await fetch('/api/admin/posts'); if (response.status === 401) return window.location.href = '/login.html'; if (!response.ok) throw new Error('Gagal memuat konten'); posts = (await response.json()).data; renderPosts() }
function openForm(post) { editingId = post?.id || null; form.reset(); form.elements.id.value = post?.id || ''; form.elements.type.value = post?.type || 'news'; form.elements.title.value = post?.title || ''; form.elements.category.value = post?.category || ''; form.elements.excerpt.value = post?.excerpt || ''; form.elements.status.value = post?.status || 'draft'; document.querySelector('#form-title').textContent = post ? 'Edit konten' : 'Buat konten baru'; error.textContent = ''; modal.hidden = false }
function closeForm() { modal.hidden = true; editingId = null }
async function removePost(id) { if (!confirm('Hapus konten ini?')) return; const response = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' }); if (!response.ok) return showToast('Anda tidak memiliki izin menghapus konten'); posts = posts.filter((post) => post.id !== id); renderPosts(); showToast('Konten berhasil dihapus') }

document.querySelector('#new-post').addEventListener('click', () => openForm())
document.querySelector('#close-modal').addEventListener('click', closeForm)
document.querySelector('#cancel-form').addEventListener('click', closeForm)
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active')); tab.classList.add('active'); filter = tab.dataset.filter; renderPosts() }))
document.querySelector('#search').addEventListener('input', renderPosts)
form.addEventListener('submit', async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(form)); const url = editingId ? `/api/admin/posts/${editingId}` : '/api/admin/posts'; const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const result = await response.json(); if (!response.ok) { error.textContent = result.error || 'Gagal menyimpan konten'; return } closeForm(); await loadPosts(); showToast('Konten berhasil disimpan') })
loadPosts().catch(() => { list.innerHTML = '<div class="empty-state">Gagal memuat konten.</div>' })
