# Website SMP Negeri 4 Majenang

Website profil sekolah dengan tampilan biru-putih yang dibangun menggunakan [Bun](https://bun.sh/) dan [Hono](https://hono.dev/).

## Fitur

- Halaman beranda dengan informasi utama sekolah.
- Profil sekolah dan statistik pendidikan.
- Daftar berita terbaru.
- Artikel blog sekolah.
- Informasi alamat, telepon, dan email.
- Form kontak dengan pesan konfirmasi di sisi browser.
- Navigasi responsif untuk perangkat desktop dan mobile.

## Persyaratan

- Bun versi terbaru.
- Git, jika proyek diambil dari repository.

Periksa instalasi Bun dengan:

```bash
bun --version
```

Jika Bun belum terpasang, ikuti panduan resmi di [bun.sh](https://bun.sh/).

## Instalasi

Masuk ke folder proyek, kemudian pasang dependensi:

```bash
cd smpn4majenang
bun install
```

## Menjalankan proyek

### Mode development

Mode ini menjalankan server dan memuat ulang aplikasi ketika file berubah:

```bash
bun run dev
```

Buka alamat berikut di browser:

```text
http://localhost:3000
```

### Mode production

Untuk menjalankan aplikasi seperti server biasa:

```bash
bun run start
```

Port default adalah `3000`. Port dapat diubah dengan environment variable `PORT`:

```bash
PORT=8080 bun run start
```

## Struktur folder

```text
.
├── public/
│   ├── app.js        # Interaksi menu mobile, navigasi aktif, dan form kontak
│   ├── index.html    # Markup dan konten halaman utama
│   ├── admin.html    # Dashboard admin dan pembagian peran
│   ├── admin.css     # Gaya dashboard admin
│   ├── admin.js      # Interaksi dashboard admin
│   ├── content.html  # Halaman CRUD berita dan blog
│   ├── content.css   # Gaya halaman pengelolaan konten
│   ├── content.js    # Interaksi CRUD konten
│   ├── users.html     # Halaman kelola pengguna admin
│   ├── users.css      # Gaya halaman pengguna admin
│   ├── users.js       # Interaksi kelola pengguna
│   ├── school-profile.html # Halaman edit profil sekolah
│   ├── school-profile.css   # Gaya halaman profil admin
│   ├── school-profile.js    # Interaksi edit profil
│   ├── site-profile.js      # Sinkronisasi profil ke website publik
│   ├── messages.html        # Inbox pesan kontak
│   ├── messages.css         # Gaya inbox pesan
│   ├── messages.js          # Interaksi inbox pesan
│   ├── login.html    # Halaman login admin
│   ├── login.js      # Proses login admin
│   ├── profil.html   # Halaman profil sekolah
│   └── styles.css    # Gaya visual dan responsive layout
├── src/
│   └── index.ts      # Server Hono dan konfigurasi port Bun
├── package.json
└── README.md
```

## Database SQLite

Data admin disimpan menggunakan SQLite melalui `bun:sqlite`. Saat server pertama kali dijalankan, aplikasi otomatis membuat database `data/smpn4majenang.sqlite`, tabel `roles`, `admin_users`, dan empat data admin contoh.

Endpoint yang tersedia:

```text
GET /api/admin/users  # Daftar admin dan perannya
GET /api/admin/roles  # Daftar peran dan permission
GET /api/admin/posts  # Daftar berita dan blog
POST /api/admin/posts # Membuat berita atau blog
PUT /api/admin/posts/:id # Mengubah konten
DELETE /api/admin/posts/:id # Menghapus konten
POST /api/admin/users # Menambahkan admin
PUT /api/admin/users/:id # Mengubah admin
DELETE /api/admin/users/:id # Menghapus admin selain Admin Utama
GET /api/public/profile # Data profil untuk website publik
GET /api/admin/profile # Membaca profil sekolah
PUT /api/admin/profile # Mengubah profil sekolah
POST /api/public/messages # Menyimpan pesan dari form kontak
GET /api/admin/messages # Membaca inbox pesan
PUT /api/admin/messages/:id/read # Menandai pesan sudah dibaca
DELETE /api/admin/messages/:id # Menghapus pesan
```

Folder `data/` sengaja tidak dilacak Git karena berisi database lokal. Salin database tersebut jika ingin memindahkan data development. Untuk production, tambahkan autentikasi/login dan validasi permission di server sebelum endpoint admin dibuka.

## Docker

### Build lokal

Build image dengan nama yang mengikuti repository:

```bash
docker build -t smpn_4_majenang:latest .
```

Jalankan image lokal dengan volume SQLite:

```bash
docker run --rm -p 3000:3000 \
  -e ADMIN_INITIAL_PASSWORD='GantiDenganPasswordKuat' \
  -v smpn4_data:/app/data \
  smpn_4_majenang:latest
```

### GitHub Actions manual

Workflow berada di `.github/workflows/docker-image.yml` dan hanya berjalan ketika dijalankan manual dari tab **Actions** di GitHub. Workflow tersebut membangun image dan, jika opsi `push_image` dipilih, mengunggahnya ke:

```text
ghcr.io/wartam/smpn_4_majenang:latest
```

Nama owner dan repository pada workflow diambil otomatis dari `${{ github.repository }}`, sehingga tetap mengikuti nama repository jika repository dipindahkan.

### Docker Compose

Buat file `.env` terlebih dahulu:

```env
ADMIN_INITIAL_PASSWORD=GantiDenganPasswordKuat
```

Kemudian jalankan:

```bash
docker compose pull
docker compose up -d
```

Website tersedia di `http://localhost:3000`. Volume `smpn4_data` menyimpan database SQLite di luar container agar data admin tidak hilang ketika container dibuat ulang.

## Mengubah konten

Sebagian besar konten website berada di `public/index.html`. File tersebut dapat diubah untuk menyesuaikan:

- Nama dan slogan sekolah.
- Alamat, nomor telepon, dan email.
- Statistik sekolah.
- Judul serta tanggal berita dan blog.
- Tautan media sosial.

Konten khusus halaman Profil Sekolah berada di `public/profil.html`. Halaman ini dapat diakses melalui menu `Profil Sekolah` atau langsung melalui alamat:

```text
http://localhost:3000/profil.html
```

## Halaman admin

Dashboard admin dapat dibuka melalui:

```text
http://localhost:3000/admin.html
```

Halaman admin dilindungi login session cookie. Peran yang disiapkan adalah Admin Utama (akses penuh), Admin Konten (berita, blog, dan media), Admin Akademik (profil dan informasi sekolah), serta Admin Layanan (pesan dan informasi kontak).

Saat database pertama kali dibuat, semua akun contoh menggunakan password awal dari environment variable `ADMIN_INITIAL_PASSWORD`. Jika variable tersebut tidak diatur, password default development adalah `AdminSMPN4!2026`. Segera ubah password dan jangan gunakan default ini pada production.

Untuk development, salin `.env.example` menjadi `.env` dan isi password yang kuat:

```bash
cp .env.example .env
```

API login dan logout:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Middleware server memeriksa session yang masih berlaku dan permission role sebelum endpoint admin diproses. Session berlaku 7 hari dan cookie menggunakan `HttpOnly` serta `SameSite=Lax`.

Warna utama dapat diubah di bagian `:root` pada `public/styles.css`:

```css
:root {
  --ink: #092d52;
  --blue: #075bbb;
  --yellow: #ffc941;
}
```

Setelah file disimpan, server development akan memperbarui halaman secara otomatis.

## Form kontak

Form kontak saat ini bekerja di sisi browser: setelah dikirim, form menampilkan pesan konfirmasi dan tidak mengirim data ke server atau database.

Untuk membuatnya benar-benar mengirim pesan, tambahkan endpoint Hono di `src/index.ts`, lalu ubah event submit di `public/app.js` agar menggunakan `fetch()` ke endpoint tersebut. Endpoint tersebut dapat dihubungkan ke email service, database, atau API sekolah.

## Catatan deployment

Aplikasi ini menggunakan API runtime Bun melalui `Bun.env` dan `Bun` server entrypoint. Pastikan Bun tersedia pada server deployment. Jalankan aplikasi menggunakan:

```bash
bun run start
```

Jika platform deployment menyediakan port melalui environment variable `PORT`, aplikasi akan menggunakannya secara otomatis.
