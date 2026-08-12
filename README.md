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
│   ├── profil.html   # Halaman profil sekolah
│   └── styles.css    # Gaya visual dan responsive layout
├── src/
│   └── index.ts      # Server Hono dan konfigurasi port Bun
├── package.json
└── README.md
```

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
