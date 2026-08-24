const sidebar = document.querySelector('#sidebar')
document.querySelector('.sidebar-toggle')?.addEventListener('click', () => sidebar?.classList.toggle('open'))
document.querySelectorAll('.admin-nav a').forEach((link) => link.addEventListener('click', () => sidebar?.classList.remove('open')))
document.querySelector('#logout-button')?.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login.html'
})
const toast = document.querySelector('.toast')
let toastTimer
document.querySelectorAll('[data-toast]').forEach((button) => button.addEventListener('click', () => {
  toast.textContent = button.dataset.toast
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600)
}))

async function loadCurrentUser() {
  const response = await fetch('/api/auth/me')
  if (!response.ok) return
  const { data: user } = await response.json()
  document.querySelectorAll('[data-current-name]').forEach((element) => { element.textContent = user.name })
  document.querySelectorAll('[data-current-initials]').forEach((element) => { element.textContent = user.initials })
  document.querySelectorAll('[data-current-role]').forEach((element) => { element.textContent = user.role_label })
  document.querySelectorAll('[data-permission]').forEach((element) => {
    const allowed = user.role === 'owner' || user.permissions.includes('*') || user.permissions.includes(element.dataset.permission)
    if (!allowed) element.hidden = true
  })
}

const roleClasses = { owner: 'owner', editor: 'editor', academic: 'academic', contact: 'contact' }
const avatarClasses = { owner: 'blue-bg', editor: 'orange', academic: 'green-bg', contact: 'purple-bg' }
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])

async function loadAdminUsers() {
  const table = document.querySelector('.role-table')
  if (!table) return
  try {
    const response = await fetch('/api/admin/users')
    if (!response.ok) throw new Error('Gagal memuat pengguna')
    const { data } = await response.json()
    const rows = data.map((user) => `<div class="role-row"><span class="person"><i class="person-avatar ${avatarClasses[user.role] || 'blue-bg'}">${escapeHtml(user.initials)}</i><b>${escapeHtml(user.name)}<small>${escapeHtml(user.email)}</small></b></span><span><em class="role-badge ${roleClasses[user.role] || 'owner'}">${escapeHtml(user.role_label)}</em></span><span>${escapeHtml(user.role_description)}</span><span><em class="status ${user.status === 'active' ? 'active' : 'pending'}">${user.status === 'active' ? 'Aktif' : 'Undangan'}</em></span><span class="more">•••</span></div>`).join('')
    const header = table.querySelector('.role-head')
    table.innerHTML = ''
    table.append(header)
    table.insertAdjacentHTML('beforeend', rows)
  } catch (error) {
    console.warn(error)
  }
}

loadAdminUsers()
loadCurrentUser().catch(() => {})
