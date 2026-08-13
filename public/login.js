const form = document.querySelector('#login-form')
const error = document.querySelector('.login-error')
document.querySelector('#toggle-password')?.addEventListener('click', (event) => {
  const input = form.querySelector('[name="password"]')
  input.type = input.type === 'password' ? 'text' : 'password'
  event.target.textContent = input.type === 'password' ? 'Lihat' : 'Sembunyikan'
})
form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const submit = form.querySelector('button[type="submit"]')
  submit.disabled = true
  error.textContent = ''
  const body = Object.fromEntries(new FormData(form))
  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Login gagal')
    window.location.href = '/admin'
  } catch (exception) {
    error.textContent = exception.message
    submit.disabled = false
  }
})
