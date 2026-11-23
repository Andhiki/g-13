# Berkontribusi ke g-13

Kontribusi dalam bahasa Indonesia atau Inggris diterima: koreksi data, laporan bug,
aksesibilitas, dokumentasi, dan kode. Baca [README](README.md) dan
[aturan komunitas](CODE_OF_CONDUCT.md) sebelum mulai. Panduan workflow agent dan
skill proyek tersedia di [AGENTS.md](AGENTS.md).

## Alur kontribusi

1. Cari issue atau PR serupa. Untuk perubahan besar, diskusikan pendekatannya di
   GitHub Issues terlebih dahulu. Koreksi kecil boleh langsung melalui PR.
2. Fork repo, clone fork, dan buat branch dari `main` terbaru.
3. Jalankan `bun install --frozen-lockfile`, `bun run build:packages`, lalu `bun run dev`.
   Gunakan versi Bun di `package.json` dan Node.js 22.12+.
4. Buat perubahan dengan scope jelas; jangan sertakan hasil tes, kredensial,
   atau perubahan format yang tidak berkaitan.
5. Jalankan `bun run check` dan `bun run build`. Jelaskan pemeriksaan yang
   belum dijalankan.
6. Buka PR ke `staging` dengan alasan perubahan, cara verifikasi, dan screenshot
   bila tampilan berubah. Maintainer meninjau lalu menggabungkannya ke `staging`
   untuk diuji. Setelah lolos pengujian, maintainer mempromosikan `staging` ke
   `main` untuk rilis produksi. Tidak ada jaminan waktu respons.
   Jangan membuka PR fitur langsung ke `main`.

Agent dapat memakai [skill PR body](.agents/skills/pr-body/SKILL.md) yang tersedia
di repo. Skill mengikuti template PR dan meminta hasil verifikasi aktual.

## Regresi browser di staging

Suite browser memakai [e2e](https://e2e.com/docs) dengan Chromium pada viewport
1440 × 900. Jalankan dengan Bun sesuai versi di `package.json` dan Node.js
22.23 atau lebih baru pada jalur 22, atau Node.js 24.22 atau lebih baru.

```sh
bun install --frozen-lockfile
node node_modules/@e2e-dev/web/dist/bin.js install chromium
bun run test:e2e:smoke
```

Smoke mengunjungi staging bersama sebagai pengunjung tanpa sesi. Hasil
dilaporkan per rute. Kegagalan upstream alumni menampilkan status HTTP terpisah
dari skenario retry yang memakai data fixture. Setelah workflow tersedia pada
branch default, smoke juga bisa dijalankan dari tab Actions melalui **Staging
browser tests**. Laporan, JUnit, dan trace kegagalan tersedia di `.e2e/` dan
sebagai artefak Actions.

`bun run test:e2e` menjalankan skenario fungsional pada Worker lokal dengan D1
SQLite sementara. Perintah ini menerapkan migrasi ke direktori temporer, memulai
Worker lokal, menjalankan browser Chromium, lalu menghentikan Worker dan menghapus
database tersebut. Sesi, data ulasan, dan batas rate limit dibuat langsung pada
D1 lokal. Tidak diperlukan akun Cloudflare, token, deployment Worker, atau
database D1 jangka panjang.

Workflow **Staging browser tests** menjalankan suite fungsional tersebut untuk
setiap PR ke `staging`, termasuk PR dari fork, setelah membangun paket workspace
dan memasang Chromium. Workflow manual tetap menjalankan smoke test read-only
terhadap staging bersama. Mode `local-e2e` menggunakan fixture alumni, Turnstile,
dan kredensial GitHub dummy agar skenario tidak menghubungi layanan eksternal.
Pemeriksaan data dan logika aplikasi tetap dijalankan dengan `bun run check`.

## Changelog

Untuk perubahan yang berdampak pada pengguna, tambahkan ringkasan singkat dalam
bahasa Indonesia ke bagian `Unreleased` di [CHANGELOG.md](CHANGELOG.md).
Kelompokkan entri di bawah `### YYYY-MM-DD` berdasarkan tanggal perubahan dicatat,
dengan tanggal terbaru di atas. Untuk tanggal yang sama, tambahkan poin ke bagian
yang sudah ada; untuk tanggal berbeda, buat bagian baru. Gunakan subbagian
`#### Added`, `#### Changed`, atau `#### Fixed` sesuai kebutuhan; fokus pada fitur, perilaku,
dan koreksi kurikulum. Perubahan internal tanpa dampak pengguna tidak perlu entri.
Untuk koreksi kurikulum atau prasyarat, sertakan tautan sumber resmi atau PR
yang memuat buktinya. Setelah rilis terkonfirmasi, maintainer memindahkan kumpulan
entri beserta kelompok tanggalnya ke bagian rilis berformat
`## <versi> - <tanggal rilis>`, lalu mengosongkan `Unreleased` untuk perubahan
berikutnya. Jangan menyalin ulang atau menghapus riwayat perubahan lama.

## Koreksi kurikulum

Baca [CONTEXT.md](CONTEXT.md), [panduan impor](docs/curriculum-import.md),
dan PDF resmi di `packages/curriculum/sources/`. Sertakan versi kurikulum, kode mata kuliah,
sumber resmi, nomor halaman, serta nilai sebelum dan sesudah koreksi. Jangan
menyamakan semester anjuran dengan jadwal penawaran atau menebak aturan akademik
yang ambigu. Pertahankan provenance di data sumber dan tambahkan tes yang relevan.

## Struktur dan kebiasaan kode

- `apps/web/src/routes/`: routing dan implementasi fitur di folder berawalan `-`
  yang diabaikan generator rute; `apps/web/src/ui/`: primitif UI.
- `apps/web/src/graph/` dan `apps/web/src/courses/`: perilaku graf dan komponen mata
  kuliah yang dipakai bersama oleh peta kurikulum dan roadmap. Modul bersama tidak
  mengimpor implementasi fitur.
- `packages/curriculum/src/curricula/<id>/`: JSON runtime, normalizer, dan aturan
  per kurikulum. `packages/curriculum/data/` menyimpan bukti audit; `packages/curriculum/sources/` menyimpan
  dokumen sumber. Ikuti [panduan impor](docs/curriculum-import.md); jangan simpan
  skrip ekstraksi PDF sekali pakai. Perubahan sumber harus menyertakan provenance.
- `*.test.ts`: tes Bun untuk perilaku data dan logika aplikasi.
- Verifikasi perubahan UI secara manual. Jangan menambahkan tes UI, termasuk
  pemeriksaan teks, posisi piksel, ukuran, tata letak, atau animasi.
- Ikuti gaya kode di sekitar perubahan. Gunakan `bun run format` dan
  `bun run lint:fix` seperlunya. Jangan edit `apps/web/src/routeTree.gen.ts` manual.
- Aturan design system untuk `apps/web` didefinisikan di `.oxlintrc.json` lewat
  plugin `@shadcn/lint`. Tambahkan aturan baru di berkas itu, bukan sebagai
  argumen CLI tiap paket, lalu pastikan `bun run lint` tetap lolos. Berkas yang
  sama juga dibaca `bun lint` setelah linter bawaan Bun tersedia di rilis stabil.
- Commit `bun.lock` bersama perubahan dependensi. Tidak perlu dependensi baru
  untuk sesuatu yang sudah tersedia di proyek.

GitHub Issues adalah pintu masuk kontributor publik sekaligus satu-satunya pelacak
isu proyek, sesuai [panduan agent](docs/issue-tracker.md).

## Hak cipta dan keamanan

Hanya kirim materi yang kamu berhak kontribusikan.
Kontribusi kode dan dokumentasi asli diberikan dengan [lisensi MIT](LICENSE)
yang sama dengan proyek.
Sertakan sumber dan lisensi kode/aset pihak ketiga; jangan mengasumsikan dokumen yang dapat diunduh bebas
otomatis berlisensi terbuka. Lihat [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Jangan unggah transkrip, data pribadi mahasiswa, atau token.
Laporkan celah keamanan melalui [SECURITY.md](SECURITY.md).
