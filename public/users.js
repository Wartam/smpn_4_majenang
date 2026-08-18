const usersList = document.querySelector('#users-list')
const userModal = document.querySelector('#user-modal')
const userForm = document.querySelector('#user-form')
const userError = document.querySelector('#user-error')
let users = []
let editingUser = null
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
const roleLabels = { owner: 'Admin Utama', editor: 'Admin Konten', academic: 'Admin Akademik', contact: 'Admin Layanan' }
const roleClasses = { owner: 'owner', editor: 'editor', academic: 'academic', contact: 'contact' }
const avatarClasses = { owner: 'blue-bg', editor: 'orange', academic: 'green-bg', contact: 'purple-bg' }
const toast = (message) => { const item = document.querySelector('.toast'); item.textContent = message; item.classList.add('show'); setTimeout(() => item.classList.remove('show'), 2300) }
function renderUsers() { usersList.innerHTML = `<div class="user-row user-head"><span>Pengguna</span><span>Role</span><span>Status</span><span></span></div>` + users.map((user) => `<div class="user-row"><span class="person"><i class="person-avatar ${avatarClasses[user.role] || 'blue-bg'}">${escapeHtml(user.initials)}</i><b>${escapeHtml(user.name)}<small>${escapeHtml(user.email)}</small></b></span><span><em class="role-badge ${roleClasses[user.role] || 'owner'}">${escapeHtml(user.role_label)}</em></span><span><em class="status ${user.status === 'active' ? 'active' : 'pending'}">${user.status === 'active' ? 'Aktif' : 'Undangan'}</em></span><span class="post-actions"><button data-edit="${user.id}">✎</button><button data-delete="${user.id}">×</button></span></div>`).join('')
  usersList.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openUser(users.find((user) => user.id === Number(button.dataset.edit)))))
  usersList.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => removeUser(Number(button.dataset.delete))))
}
async function loadUsers() { const response = await fetch('/api/admin/users'); if (response.status === 401 || response.status === 403) return window.location.href = '/admin'; if (!response.ok) throw new Error('Gagal memuat pengguna'); users = (await response.json()).data; renderUsers() }
function openUser(user) { editingUser = user?.id || null; userForm.reset(); userForm.elements.id.value = user?.id || ''; userForm.elements.name.value = user?.name || ''; userForm.elements.email.value = user?.email || ''; userForm.elements.role.value = user?.role || 'editor'; userForm.elements.status.value = user?.status || 'active'; userForm.elements.password.required = !user; document.querySelector('#user-form-title').textContent = user ? 'Edit pengguna' : 'Tambah pengguna'; userError.textContent = ''; userModal.hidden = false }
async function removeUser(id) { if (!confirm('Hapus pengguna ini?')) return; const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); const result = await response.json(); if (!response.ok) return toast(result.error || 'Pengguna tidak dapat dihapus'); users = users.filter((user) => user.id !== id); renderUsers(); toast('Pengguna berhasil dihapus') }
function closeUser() { userModal.hidden = true; editingUser = null }
document.querySelector('#new-user').addEventListener('click', () => openUser())
document.querySelector('#close-user').addEventListener('click', closeUser)
document.querySelector('#cancel-user').addEventListener('click', closeUser)
userForm.addEventListener('submit', async (event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(userForm)); if (!values.password) delete values.password; const url = editingUser ? `/api/admin/users/${editingUser}` : '/api/admin/users'; const response = await fetch(url, { method: editingUser ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) }); const result = await response.json(); if (!response.ok) { userError.textContent = result.error || 'Gagal menyimpan pengguna'; return } closeUser(); await loadUsers(); toast('Pengguna berhasil disimpan') })
loadUsers().catch(() => { usersList.innerHTML = '<div class="empty-state">Gagal memuat pengguna.</div>' })
