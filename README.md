# g-13

Peta kurikulum S1 Ilmu Komputer UGM, proyek komunitas publik yang dikerjakan pengguna bersama tim teman-temannya.

## Cakupan

- Kurikulum 2021 Revisi 2023 dan 2026 sejak MVP.
- Peta relasi, daftar, pencarian, detail, teks prasyarat, dan filter minat/kelompok pilihan.
- Tidak meminta transkrip atau menghitung kelayakan KRS pribadi.
- Tidak mengasumsikan afiliasi Himakom atau pengesahan prodi.

## Menjalankan prototipe

Node.js 20.19+ atau 22.12+ diperlukan.

    npm install
    npm run dev

Build statis lokal dijalankan dengan npm run build; hasilnya berada di dist/.

## Dokumen dan data

- docs/build-plan.md — rencana implementasi dan kebutuhan sumber daya
- docs/discovery.md — temuan, sumber, keputusan, dan pertanyaan
- docs/verification.md — pemeriksaan ekstraksi dan batas verifikasi
- CONTEXT.md — glosarium
- docs/ilkom-2021-extraction.md dan docs/ilkom-2026-extraction.md — catatan ekstraksi

Dataset ada di output/data/; sumber PDF dan snapshot halaman ada di output/sources/. UI memakai JSON ekstraksi, mempertahankan teks prasyarat, dan hanya menggambar hubungan ketika nama mata kuliah cocok persis. Prototipe belum melalui audit aturan akademik atau pilot mahasiswa.

Folder kerja: C:\.Projects\g-13.
