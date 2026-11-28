# Berkontribusi ke g-13

Kontribusi diterima: koreksi data, laporan bug,
aksesibilitas, dokumentasi, dan kode. Baca [README](README.md) dan
[aturan komunitas](CODE_OF_CONDUCT.md) sebelum mulai. Panduan workflow agent dan
skill proyek tersedia di [AGENTS.md](AGENTS.md).

Tulis issue, pull request, komentar, dan pesan commit dalam bahasa Inggris
agar mudah dibaca semua maintainer dan agent. Teks sumber berbahasa Indonesia
(dokumen kurikulum, teks antarmuka) boleh dikutip apa adanya.

## Alur kontribusi

1. Cari issue atau PR serupa. Untuk perubahan besar, diskusikan pendekatannya di
   GitHub Issues terlebih dahulu. Koreksi kecil boleh langsung melalui PR.
2. Fork repo, clone fork, dan buat branch dari `main` terbaru.
3. Jalankan `bun install --frozen-lockfile`, `bun run build:packages`, lalu `bun run dev`.
   Gunakan versi Bun dan Node.js di `package.json` (`packageManager` dan
   `engines`): Bun 1.4.4 dan Node.js 26.13+. Node.js hanya diperlukan untuk build
   trailer, CLI Cloudflare, dan runner E2E lokal.
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

## Regresi browser

Suite browser menggunakan [e2e](https://e2e.com/docs) dengan Chromium pada viewport
1440 × 900. Gunakan versi Bun dan Node.js di `package.json`.

```sh
bun install --frozen-lockfile
bun node_modules/@e2e-dev/web/dist/bin.js install chromium
bun run build:packages
bun run test:e2e
bun run test:e2e:smoke
```

Skenario di `e2e/local/` menjalankan Worker lokal dengan D1 SQLite sementara.
E2E memulai launcher, menunggu Worker siap, dan menghentikan launcher setelah
tes. Launcher menerapkan migrasi dan menghapus database sementara saat berhenti.
Fixture di `e2e/fixtures/` membuat sesi, ulasan, dan batas rate limit lokal.
Jalankan suite dengan satu worker karena fixture mereset database yang dipakai
bersama. Mode `local-e2e` menyediakan fixture alumni dan Turnstile serta
kredensial GitHub uji. Perintah ini bisa dijalankan tanpa akun Cloudflare.

Suite `e2e/smoke/` hanya mengirim GET dan HEAD ke origin staging bersama.
Tes direktori alumni melaporkan status endpoint upstream dan menunggu halaman
selesai dimuat. Workflow **Staging browser tests** menjalankan suite lokal
tanpa model pada setiap PR ke `staging`, termasuk PR dari fork. Jalankan smoke
melalui workflow manual atau perintah di atas. Laporan, JUnit, log Worker lokal,
dan trace kegagalan tersedia di `.e2e/local/` atau `.e2e/smoke/`.

### Skenario agen

Skenario di `e2e/agent/` memakai `agent.act()` untuk menyelesaikan alur pengguna
dan assertion yang presisi untuk memeriksa hasilnya. Untuk merekam skenario
secara lokal, masuk dengan akun ChatGPT yang memiliki akses Codex.

```sh
node node_modules/e2e/dist/cli/bin.js login openai
bun run test:e2e:agent
```

Tambahkan `--device` saat login dari terminal jarak jauh. Gunakan
`E2E_AGENT_MODEL` untuk memilih model lain yang tersedia di akunmu.
Commit rekaman aksi yang terverifikasi di `e2e/cache/`. Jalankan
`CI=1 bun run test:e2e:agent` untuk memeriksa replay tanpa login atau model.
Workflow **Staging browser tests** menjalankan perintah ini untuk setiap PR.
Jika rekaman hilang atau tidak lagi cocok, perbarui dari run lokal dan commit
hasilnya. Laporan agen tersedia di `.e2e/agent/`.

Untuk menulis atau men-debug tes dengan coding agent, baca panduan versi
terpasang dengan `node node_modules/e2e/dist/cli/bin.js guide`. Server MCP lokal
dapat dijalankan dengan `node node_modules/e2e/dist/cli/bin.js mcp --max-sessions 1`
setelah paket workspace dibangun.

## Catatan rilis

[GitHub Releases](https://github.com/Andhiki/g-13/releases) menyimpan riwayat rilis publik.
Untuk perubahan yang berdampak pada pengguna, jelaskan hasilnya secara singkat dalam bahasa
Inggris di deskripsi PR. Untuk koreksi kurikulum atau prasyarat, sertakan edisi, kode mata
kuliah, sumber resmi, nomor halaman, serta nilai sebelum dan sesudah koreksi.

PR promosi dari `staging` ke `main` membawa seluruh perubahan yang ada di
`staging`. Pilih satu label versi: `release:patch` untuk perbaikan,
`release:minor` untuk fitur kompatibel, atau `release:major` untuk perubahan
yang memutus kompatibilitas. Pemeriksaan PR menampilkan versi yang diusulkan.

Jika perbaikan perlu terbit sebelum perubahan lain di `staging`, buat branch
`hotfix/<nama>` dari `main` dan cherry-pick hanya commit perbaikannya. Buka PR
ke `main` dengan label `release:patch`. Setelah rilis, gabungkan `main` kembali
ke `staging` agar riwayat perbaikan terbawa.

Workflow memverifikasi PR dan label sebelum deploy produksi. Setelah deploy
berhasil, workflow menandai commit yang dideploy dengan tag SemVer dan
menerbitkan catatan awal. Maintainer memperbarui catatan itu dalam bahasa
Indonesia dan mempertahankan tautan perbandingan serta atribusi kontributor.

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
- Verifikasi tampilan UI secara manual. Pakai E2E untuk perilaku pengguna dan
  hasil yang dapat diamati, seperti navigasi, persistensi, dan pemulihan dari error.
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
