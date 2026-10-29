# Berkontribusi ke g-13

Kontribusi dalam bahasa Indonesia atau Inggris diterima: koreksi data, laporan bug,
aksesibilitas, dokumentasi, dan kode. Baca [README](README.md) dan
[aturan komunitas](CODE_OF_CONDUCT.md) sebelum mulai. Panduan workflow agent dan
skill proyek tersedia di [AGENTS.d](AGENTS.d/README.md).

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
6. Buka PR ke `main` dengan alasan perubahan, cara verifikasi, dan screenshot
   bila tampilan berubah. Maintainer meninjau sebelum merge; tidak ada jaminan
   waktu respons.

Agent dapat memakai [skill PR body](.agents/skills/pr-body/SKILL.md) yang tersedia
di repo. Skill mengikuti template PR dan meminta hasil verifikasi aktual.

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

Baca [CONTEXT.md](CONTEXT.md), [panduan impor](AGENTS.d/curriculum-import.md),
dan PDF resmi di `output/sources/`. Sertakan versi kurikulum, kode mata kuliah,
sumber resmi, nomor halaman, serta nilai sebelum dan sesudah koreksi. Jangan
menyamakan semester anjuran dengan jadwal penawaran atau menebak aturan akademik
yang ambigu. Pertahankan provenance di data sumber dan tambahkan tes yang relevan.

## Struktur dan kebiasaan kode

- `apps/web/src/routes/`: routing; `apps/web/src/features/`: fitur; `apps/web/src/ui/`: primitif UI.
- `apps/web/src/graph/` dan `apps/web/src/courses/`: perilaku graf dan komponen mata
  kuliah yang dipakai bersama oleh peta kurikulum dan roadmap. Modul bersama tidak
  mengimpor implementasi fitur.
- `packages/curriculum/src/curricula/<id>/`: JSON runtime, normalizer, dan aturan
  per kurikulum. `output/data/` menyimpan bukti audit; `output/sources/` menyimpan
  dokumen sumber. Ikuti [panduan impor](AGENTS.d/curriculum-import.md); jangan simpan
  skrip ekstraksi PDF sekali pakai. Perubahan sumber harus menyertakan provenance.
- `*.test.ts`: tes Bun untuk perilaku data dan logika aplikasi.
- Ikuti gaya kode di sekitar perubahan. Gunakan `bun run fmt` dan
  `bun run lint:fix` seperlunya. Jangan edit `apps/web/src/routeTree.gen.ts` manual.
- Commit `bun.lock` bersama perubahan dependensi. Tidak perlu dependensi baru
  untuk sesuatu yang sudah tersedia di proyek.

GitHub Issues adalah pintu masuk kontributor publik. Tiket Markdown `.scratch/`
tetap dipakai untuk rencana implementasi lokal sesuai
[panduan agent](AGENTS.d/issue-tracker.md); kontributor tidak wajib membuatnya.

## Hak cipta dan keamanan

Hanya kirim materi yang kamu berhak kontribusikan.
Kontribusi kode dan dokumentasi asli diberikan dengan [lisensi MIT](LICENSE)
yang sama dengan proyek.
Sertakan sumber dan lisensi kode/aset pihak ketiga; jangan mengasumsikan dokumen yang dapat diunduh bebas
otomatis berlisensi terbuka. Lihat [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Jangan unggah transkrip, data pribadi mahasiswa, atau token.
Laporkan celah keamanan melalui [SECURITY.md](SECURITY.md).
