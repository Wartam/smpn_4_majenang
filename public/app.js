const toggle = document.querySelector('.menu-toggle')
const nav = document.querySelector('.main-nav')
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open')
  toggle.setAttribute('aria-expanded', String(open))
})
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => nav.classList.remove('open')))
const form = document.querySelector('.contact-form')
form?.addEventListener('submit', (event) => {
  event.preventDefault()
  const status = form.querySelector('.form-status')
  status.textContent = 'Terima kasih, pesan Anda sudah kami terima.'
  form.reset()
})
const links = document.querySelectorAll('.main-nav a')
const sections = document.querySelectorAll('main section[id]')
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { links.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)) } }), { rootMargin: '-40% 0px -50% 0px' })
sections.forEach((section) => observer.observe(section))
