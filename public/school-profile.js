const form = document.querySelector('#profile-form')
const error = document.querySelector('#profile-error')
const savedAt = document.querySelector('#saved-at')
const toast = document.querySelector('.toast')
const fields = { school_name: 'schoolName', tagline: 'tagline', address: 'address', phone: 'phone', email: 'email', founded_year: 'foundedYear', students: 'students', teachers: 'teachers', classrooms: 'classrooms', vision: 'vision', mission: 'mission' }
async function loadProfile() { const response = await fetch('/api/admin/profile'); if (response.status === 403) return window.location.href = '/admin'; const { data } = await response.json(); Object.entries(fields).forEach(([key, name]) => { form.elements[name].value = data[key] ?? '' }); savedAt.textContent = data.updated_at ? `Terakhir diperbarui: ${data.updated_at}` : '' }
form.addEventListener('submit', async (event) => { event.preventDefault(); error.textContent = ''; const response = await fetch('/api/admin/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); const result = await response.json(); if (!response.ok) { error.textContent = result.error || 'Gagal menyimpan profil'; return } savedAt.textContent = `Tersimpan: ${result.data.updated_at}`; toast.textContent = 'Profil sekolah berhasil diperbarui'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400) })
loadProfile().catch(() => { error.textContent = 'Profil sekolah gagal dimuat' })
