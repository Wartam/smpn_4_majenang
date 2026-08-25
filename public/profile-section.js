const sectionConfig = {
  '/profil/sambutan': { number: '01', label: 'SAMBUTAN KEPALA SEKOLAH', title: 'Setiap anak punya cahaya sendiri', intro: 'Pesan Kepala Sekolah untuk seluruh warga dan pengunjung SMP Negeri 4 Majenang.', heading: 'Sambutan Kepala Sekolah', field: 'principal_message', fallback: 'Tugas kami bukan menyeragamkan anak-anak, melainkan membantu mereka menemukan cahaya dan kekuatan yang sudah ada di dalam dirinya.\n\n— Raden Sri Pramana Budiarsa, S.Pd., M.Pd.' },
  '/profil/sejarah': { number: '01', label: 'SEJARAH SEKOLAH', title: 'Perjalanan yang terus bertumbuh', intro: 'Mengenal perjalanan SMP Negeri 4 Majenang dalam mendampingi generasi muda.', heading: 'Dari ruang belajar menjadi rumah tumbuh', field: 'history', fallback: 'SMP Negeri 4 Majenang hadir sebagai bagian penting dari perjalanan pendidikan masyarakat Majenang. Sejak berdiri pada 2006, sekolah terus berkembang dengan semangat menghadirkan pembelajaran yang bermakna, aman, dan relevan.' },
  '/profil/visi-misi': { number: '02', label: 'ARAH PENDIDIKAN', title: 'Visi dan misi sekolah', intro: 'Arah pendidikan yang menjadi dasar setiap program dan layanan sekolah.', heading: 'Mendidik dengan tujuan yang jelas', field: 'vision', visionFallback: 'Terwujudnya peserta didik yang bertaqwa, cerdas, terampil, dan cinta lingkungan.', missionFallback: 'Menyelenggarakan pembelajaran yang aktif, kreatif, dan berpihak pada murid serta membangun budaya sekolah yang ramah, disiplin, dan kolaboratif.' },
  '/profil/struktur': { number: '03', label: 'STRUKTUR ORGANISASI', title: 'Struktur organisasi sekolah', intro: 'Pembagian peran yang mendukung tata kelola sekolah secara kolaboratif.', heading: 'Bekerja bersama untuk layanan terbaik', field: 'organization', fallback: 'Pengelolaan sekolah dilaksanakan secara kolaboratif oleh kepala sekolah, wakil kepala sekolah, guru, tenaga kependidikan, komite sekolah, dan seluruh warga sekolah.\n\nKepala Sekolah: Raden Sri Pramana Budiarsa, S.Pd., M.Pd.' },
  '/profil/sarpras': { number: '04', label: 'SARANA & PRASARANA', title: 'Sarana dan prasarana', intro: 'Lingkungan belajar yang disiapkan untuk mendukung tumbuh kembang peserta didik.', heading: 'Ruang untuk belajar dan berkarya', field: 'facilities', fallback: 'Perpustakaan: ruang baca dengan koleksi yang terus berkembang.\n\nLaboratorium IPA: tempat menguji rasa ingin tahu menjadi penemuan.\n\nLapangan olahraga: ruang bergerak, berlatih, dan membangun sportivitas.' }
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
function renderProfileSection(data = {}) {
  const body = document.querySelector('#section-body')
  const storedContent = String(data[config.field] ?? '').trim()
  const content = storedContent.length > 2 ? storedContent : (config.fallback || '').trim()
  if (config.field === 'principal_message') {
    body.innerHTML = `<div class="principal-message-grid"><div class="principal-message-portrait"><img src="/kepala-sekolah.jpg" alt="Raden Sri Pramana Budiarsa, S.Pd., M.Pd., Kepala Sekolah SMP Negeri 4 Majenang" /><small>KEPALA SEKOLAH</small></div><div>${paragraphs(content)}</div></div>`
  } else if (config.field === 'vision') {
    body.innerHTML = `<h3>Visi</h3>${paragraphs(data.vision || config.visionFallback)}<h3>Misi</h3>${paragraphs(data.mission || config.missionFallback)}`
  } else {
    body.innerHTML = paragraphs(content)
  }
}
async function loadProfileSection() {
  try {
    const response = await fetch('/api/public/profile', { cache: 'no-store' })
    if (!response.ok) throw new Error('Profil sekolah gagal dimuat')
    const { data } = await response.json()
    renderProfileSection(data)
  } catch (error) {
    renderProfileSection()
    console.error(error)
  }
  document.querySelectorAll('.current-year').forEach((element) => { element.textContent = new Date().getFullYear() })
}
loadProfileSection()
