# g-13

Peta kurikulum S1 Ilmu Komputer UGM, proyek komunitas publik yang dikerjakan pengguna bersama tim teman-temannya.

## Cakupan

- Kurikulum 2021 Revisi 2023 dan 2026 sejak MVP.
- Peta relasi, daftar, pencarian, detail, teks prasyarat, dan filter minat/kelompok pilihan.
- Tidak meminta transkrip atau menghitung kelayakan KRS pribadi.
- Tidak mengasumsikan afiliasi Himakom atau pengesahan prodi.

## Menjalankan aplikasi

Bun 1.4.3 digunakan untuk mengelola dependensi dan menjalankan skrip.
Node.js 22.12+ diperlukan oleh toolchain TanStack Start.

    bun install --frozen-lockfile
    bun run dev

Aplikasi memakai TanStack Start dan TanStack Router untuk routing berbasis file,
validasi parameter pencarian, dan server-side rendering. Tailwind CSS diproses
melalui plugin Vite. React Flow tetap menangani peta interaktif. Vite memakai
Cloudflare plugin untuk menjalankan SSR pada runtime Workers.

Build dan preview lokal:

    bun run build
    bun run preview

## Deploy ke Cloudflare Workers

`wrangler.jsonc` menyetel entrypoint TanStack Start dan kompatibilitas runtime
Workers. Deploy lokal setelah build:

    bun run build
    bun run deploy

Untuk deploy otomatis dari GitHub, hubungkan repository melalui **Workers & Pages**
di dashboard Cloudflare. Nama Worker harus sama dengan `name` di `wrangler.jsonc`.
Gunakan `bun run build` sebagai build command, `bun run deploy` sebagai deploy
command, dan `bunx wrangler preview` sebagai preview command. Pilih branch
produksi, biasanya `main`. Aktifkan preview builds untuk branch dan pull request
lain.

Rute berada di `src/routes/`, dokumen HTML dan metadata di `src/routes/__root.tsx`,
dan konfigurasi router di `src/router.tsx`. Parameter `kurikulum` dan `mk` tetap
mendukung tautan langsung. `src/routeTree.gen.ts` dibuat otomatis saat menjalankan
server pengembangan atau build; file ini disimpan di Git dan tidak diformat manual.

Pemeriksaan lokal:

    bun run check

`check` menjalankan Oxlint, pemeriksaan format Oxfmt, TypeScript, dan tes Bun.
Gunakan `bun run test` untuk menjalankan tes data dan perilaku kurikulum.
Gunakan `bun run test:browser` untuk tes interaksi browser; instal Chromium
dengan `bunx playwright install chromium` terlebih dahulu. Cakupan dan cara
menjalankannya ada di [docs/testing.md](docs/testing.md).
Gunakan `bun run fmt` untuk memformat kode dan konfigurasi aplikasi, atau
`bun run lint:fix` untuk menerapkan perbaikan lint otomatis.
Dataset dan dokumen sumber tidak termasuk dalam cakupan formatter.
Commit `bun.lock` saat mengubah dependensi.

## Dokumen dan data

- docs/build-plan.md — rencana implementasi dan kebutuhan sumber daya
- docs/discovery.md — temuan, sumber, keputusan, dan pertanyaan
- docs/verification.md — pemeriksaan ekstraksi dan batas verifikasi
- CONTEXT.md — glosarium
- docs/ilkom-2021-extraction.md dan docs/ilkom-2026-extraction.md — catatan ekstraksi

Dataset ada di output/data/; sumber PDF dan snapshot halaman ada di output/sources/. UI memakai JSON ekstraksi, mempertahankan teks prasyarat, dan hanya menggambar hubungan ketika nama mata kuliah cocok persis. Prototipe belum melalui audit aturan akademik atau pilot mahasiswa.

Folder kerja: C:\.Projects\g-13.
