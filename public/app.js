const toggle = document.querySelector('.menu-toggle')
const nav = document.querySelector('.main-nav')
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  toggle.setAttribute('aria-expanded', String(open))
})
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')))
const form = document.querySelector('.contact-form')
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
const links = document.querySelectorAll('.main-nav a')
const sections = document.querySelectorAll('main section[id]')
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)) } }), { rootMargin: '-40% 0px -50% 0px' })
sections.forEach((section) => observer.observe(section))
