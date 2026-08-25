async function loadPublicProfile() {
  const response = await fetch('/api/public/profile')
  if (!response.ok) return
  const { data } = await response.json()
  const heroCount = document.querySelector('.hero-note b')
  if (heroCount) heroCount.textContent = `${data.students} murid`
  document.querySelectorAll('.stats strong')[0]?.replaceChildren(String(data.founded_year))
  document.querySelectorAll('.stats strong')[1]?.replaceChildren(String(data.teachers))
  document.querySelectorAll('.stats strong')[2]?.replaceChildren(String(data.classrooms))
  const contact = document.querySelectorAll('.contact-details p')
  if (contact[0]) contact[0].textContent = `Alamat\n${data.address}`
  if (contact[1]) contact[1].textContent = `Telepon\n${data.phone} · ${data.email}`
  const profileName = document.querySelector('.profile-hero h1 em')
  if (profileName) profileName.textContent = data.school_name.replace(/^SMP\s*/i, 'SMP ')
  const profileYear = document.querySelector('.profile-story h2 em')
  if (profileYear) profileYear.textContent = `sejak ${data.founded_year}`
  const timelineYear = document.querySelector('.timeline strong')
  if (timelineYear) timelineYear.textContent = data.founded_year
  const valueTexts = document.querySelectorAll('.values-grid article p')
  if (valueTexts[0]) valueTexts[0].textContent = data.vision
  if (valueTexts[1]) valueTexts[1].textContent = data.mission
  document.querySelectorAll('.current-year').forEach((element) => { element.textContent = new Date().getFullYear() })
}
loadPublicProfile().catch(() => {})

async function loadVisitorCount() {
  try {
    const response = await fetch('/api/public/feedback/stats', {
      cache: 'no-store'
    })

    if (!response.ok) return

    const result = await response.json()
    const count = document.querySelector('#visitor-count')

    if (count && result?.data?.count !== undefined) {
      count.textContent = String(result.data.count)
    }
  } catch (error) {
    console.error('Gagal memuat jumlah masukan:', error)
  }
}

loadVisitorCount()
