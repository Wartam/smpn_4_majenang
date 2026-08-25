const sectionConfig = {
  '/profil/sejarah': { number: '01', label: 'SEJARAH SEKOLAH', title: 'Perjalanan yang terus bertumbuh', intro: 'Mengenal perjalanan SMP Negeri 4 Majenang dalam mendampingi generasi muda.', heading: 'Dari ruang belajar menjadi rumah tumbuh', field: 'history' },
  '/profil/visi-misi': { number: '02', label: 'ARAH PENDIDIKAN', title: 'Visi dan misi sekolah', intro: 'Arah pendidikan yang menjadi dasar setiap program dan layanan sekolah.', heading: 'Mendidik dengan tujuan yang jelas', field: 'vision' },
  '/profil/struktur': { number: '03', label: 'STRUKTUR ORGANISASI', title: 'Struktur organisasi sekolah', intro: 'Pembagian peran yang mendukung tata kelola sekolah secara kolaboratif.', heading: 'Bekerja bersama untuk layanan terbaik', field: 'organization' },
  '/profil/sarpras': { number: '04', label: 'SARANA & PRASARANA', title: 'Sarana dan prasarana', intro: 'Lingkungan belajar yang disiapkan untuk mendukung tumbuh kembang peserta didik.', heading: 'Ruang untuk belajar dan berkarya', field: 'facilities' }
}
const config = sectionConfig[window.location.pathname] || sectionConfig['/profil/sejarah']
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
const paragraphs = (value) => String(value ?? '').trim().split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`).join('')
document.title = `${config.label} — SMP Negeri 4 Majenang`
document.querySelector('#section-number').textContent = config.number
document.querySelector('#section-label').textContent = config.label
document.querySelector('#section-title').textContent = config.title
document.querySelector('#section-intro').textContent = config.intro
document.querySelector('#section-heading').textContent = config.heading
async function loadProfileSection() {
  const response = await fetch('/api/public/profile', { cache: 'no-store' })
  if (!response.ok) throw new Error('Profil sekolah gagal dimuat')
  const { data } = await response.json()
  const body = document.querySelector('#section-body')
  if (config.field === 'vision') {
    body.innerHTML = `<h3>Visi</h3>${paragraphs(data.vision)}<h3>Misi</h3>${paragraphs(data.mission)}`
  } else {
    body.innerHTML = paragraphs(data[config.field])
  }
  document.querySelectorAll('.current-year').forEach((element) => { element.textContent = new Date().getFullYear() })
}
loadProfileSection().catch((error) => { document.querySelector('#section-body').innerHTML = `<p>${escapeHtml(error.message)}</p>` })
