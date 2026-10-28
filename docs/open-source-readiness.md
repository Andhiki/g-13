# Persiapan open source

Audit awal: 26 Oktober 2026. Ini checklist operasional, bukan sertifikasi hukum
atau audit keamanan lengkap. Perubahan lokal belum otomatis mengubah repo GitHub.

## Sudah disiapkan di repo

- Panduan kontribusi, aturan komunitas, kebijakan keamanan, dan kredit sumber.
- Lisensi MIT untuk kode/dokumentasi asli, beserta metadata paket dan aturan
  kontribusi yang selaras. Pemilik proyek memilih MIT pada 26 Oktober 2026.
- Template issue bug/koreksi data/usulan fitur dan template PR.
- CI untuk lint, format, tipe, unit test, dan build. Menggunakan
  `pull_request`, token baca saja, tanpa kredensial deploy, dengan actions yang
  dipin ke commit. CI harus berhasil di GitHub sebelum dijadikan required check.
- Dependabot mingguan untuk GitHub Actions. Pembaruan paket Bun tetap dilakukan
  dengan `bun.lock` dan verifikasi aplikasi; konfigurasi ini tidak mengklaim
  pembaruan otomatis semua dependensi.
- Ignore file kredensial lokal dan artefak browser tambahan. Ignore tidak menghapus
  file yang sudah pernah masuk Git atau riwayatnya.

## Status GitHub yang diverifikasi

| Pengaturan | Status saat audit |
| --- | --- |
| Visibilitas | Public |
| Branch default | `main` |
| Issues | Aktif |
| Secret scanning / push protection | Aktif |
| Private vulnerability reporting | Nonaktif |
| Rulesets / branch protection `main` | Tidak ada |
| Dependabot security updates | Nonaktif |
| Hapus branch setelah merge | Nonaktif |
| Description | Kosong |

## Tindakan maintainer sebelum promosi publik

1. **Hak kontribusi:** lisensi MIT sudah dipilih dan dipasang. Pastikan pemegang
   hak kontribusi yang sudah ada menyetujui rilis MIT. Materi pihak ketiga tetap
   mengikuti hak dan lisensinya masing-masing.
2. **Hak aset/data:** konfirmasi izin redistribusi PDF/snapshot/teks UGM, logo
   OmahTI, GIF Sonic, serta asal setiap kode/aset adaptasi. Bila izin tidak jelas,
   ganti aset atau keluarkan salinan dari distribusi dan simpan tautan sumber.
   Menghapus file sekarang tidak menghapus salinan pada riwayat Git.
3. **Kontak privat:** tetapkan kanal kontak yang benar-benar dipantau untuk laporan
   perilaku dan keamanan, lalu ganti arahan profil di `CODE_OF_CONDUCT.md` dan
   `SECURITY.md` dengan alamat/formulir konkret. Jangan memasukkan alamat rekaan.
4. **Settings → Security:** aktifkan private vulnerability reporting dan
   Dependabot alerts/security updates. Tinjau temuan secret scanning yang ada.
   Lihat [panduan keamanan GitHub](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository).
5. **Settings → Rules → Rulesets:** lindungi `main` dari force push dan penghapusan,
   wajibkan PR, diskusi terselesaikan, dan check `Quality checks` setelah CI
   pertama muncul. Jika ada maintainer kedua, wajibkan satu approval dan batalkan approval
   lama saat kode berubah. Pilih aturan review yang tetap memungkinkan maintainer
   tunggal mengelola proyek. Batasi bypass ke kebutuhan nyata.
   [Panduan GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches).
6. **Settings → Actions → General:** gunakan token default read-only, jangan izinkan
   workflows membuat/menyetujui PR, dan minta approval untuk workflow kontributor
   eksternal sesuai kebutuhan. Jangan jalankan kode fork dengan secret deployment.
7. **Cloudflare:** periksa izin integrasi GitHub, branch produksi, dan kebijakan
   preview fork. Jangan memasukkan token Cloudflare ke CI kontribusi publik.
   Pengaturan dashboard Cloudflare belum diverifikasi pada audit ini.
8. **About / General:** isi deskripsi, URL situs yang telah dikonfirmasi, dan topik
   relevan; aktifkan penghapusan branch setelah merge bila sesuai workflow tim.
9. **Sebelum release:** tinjau riwayat Git untuk rahasia/data pribadi dan jalankan
   seluruh CI pada commit yang akan dirilis. Bila rahasia pernah dipublikasikan,
   rotasi/revoke terlebih dahulu; penghapusan file saja tidak cukup.

Pengaturan GitHub dapat dikerjakan lewat UI atau API dengan akses admin; bukan
keterbatasan teknis mutlak agent. Audit ini membaca pengaturan tanpa mengubah
kebijakan akses, deployment, atau visibilitas. Keputusan hak cipta dan penetapan
kontak privat tetap memerlukan pemilik proyek.

## Hasil verifikasi lokal perubahan persiapan

- Lint, TypeScript, 55 unit test, dan build berhasil pada working tree saat audit.
- `bun run check` berhenti di formatter: 66 file di luar perubahan persiapan ini
  dilaporkan bermasalah. Tidak dilakukan pemformatan massal.
- YAML konfigurasi baru berhasil diparse; tautan dokumen lokal baru diperiksa.
- Pada tanggal audit, browser test dan eksekusi GitHub Actions belum dijalankan.
  Build masih memberi warning ukuran chunk dan sourcemap CSS.
- Runtime Bun lokal melaporkan `1.4.0-canary.1`, sedangkan `packageManager`
  menetapkan `1.4.3`; hasil lokal tidak membuktikan eksekusi dengan versi CI.
- Audit seluruh riwayat secret, audit lisensi seluruh dependensi, izin materi
  pihak ketiga, dan konfigurasi Cloudflare belum diselesaikan.
