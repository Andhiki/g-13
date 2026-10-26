# Changelog

Catatan perubahan yang berdampak pada pengguna g-13. Perubahan yang belum dirilis
dicatat di `Unreleased`, dikelompokkan berdasarkan tanggal perubahan dicatat
(`YYYY-MM-DD`), dengan tanggal terbaru di atas. Tanggal ini bukan tanggal rilis.
Riwayat sebelum changelog ini dibuat tersedia di
[commit GitHub](https://github.com/Andhiki/g-13/commits/main/).

## Unreleased

Ada ide supaya g-13 makin enak dipakai? Ceritakan lewat
[GitHub Issues](https://github.com/Andhiki/g-13/issues/new/choose).
Usulan fitur, laporan bug, dan koreksi kurikulum semuanya diterima.

### 2026-10-26

#### Added

- Handle pada detail mata kuliah di mobile untuk mengatur tinggi panel ke 30%
  atau 75% layar melalui seret atau keyboard.
- Pintasan `D` untuk mengganti tema terang/gelap.
  ([1e2f331](https://github.com/Andhiki/g-13/commit/1e2f331f1e37247b1b96f0cc583c27be7e5da734))
- Silabus dan referensi bersumber pada detail mata kuliah, dengan bagian yang
  dapat dibuka dan ditutup.
  ([8bab85d](https://github.com/Andhiki/g-13/commit/8bab85d3b623dfa9ccf8ed5b361bd82b2c4f81b6))
- Panduan kontribusi, pelaporan bug, koreksi data, dan keamanan untuk kontributor
  publik.
  ([4c084a9](https://github.com/Andhiki/g-13/commit/4c084a9700f978383403320b13e342fc5f5898bc))
- Changelog dan panduan kontribusi untuk mencatat perubahan yang berdampak pada
  pengguna.

#### Changed

- Tombol "Tampilkan mata kuliah" dan "Tampilkan roadmap" dihapus karena filter
  langsung diterapkan. Panel filter mobile ditutup lewat tombol silang di header.
- Sudut atas drawer mobile menggunakan radius 10px, mengikuti tombol. Detail mata kuliah di roadmap mobile juga tampil sebagai panel bawah.
- Pemilihan versi kurikulum menggunakan tab, dengan tipografi pilihan filter
  yang lebih konsisten.
  ([1da33de](https://github.com/Andhiki/g-13/commit/1da33de0c5fc3c6e6e04bc3e3f0bf9816ca6b315))
- Filter desktop berpindah ke toolbar pada tampilan daftar. Perpindahan antara
  peta dan daftar dianimasikan sambil mempertahankan keadaan filter terbuka.

#### Fixed

- Handle detail mata kuliah mengikuti gerakan drag tanpa me-render ulang peta
  atau mengubah ruang daftar pada setiap gerakan. Tinggi disimpan saat dilepas.
- Posisi filter mobile dikunci ke bawah viewport selama animasi pembukaan.
- Ruang bawah daftar mata kuliah mengikuti tinggi panel detail yang dipilih.
- Fokus peta menyesuaikan mata kuliah pilihan yang cocok dengan filter, serta
  menampilkan pesan ketika tidak ada mata kuliah pilihan yang cocok.
  ([aef607a](https://github.com/Andhiki/g-13/commit/aef607ad34c21983ba42a185334e21592d64e28b))
- Animasi pergantian tema menutupi seluruh viewport.
  ([7d42b5e](https://github.com/Andhiki/g-13/commit/7d42b5e4e29000d057bdf6ba7ee9fa4f6a499c42))
- Nama kelompok kurikulum yang panjang dipotong agar tetap muat dalam kontrol
  filter.
  ([ce1b059](https://github.com/Andhiki/g-13/commit/ce1b05921584edde930c800abf5b66df1944e903))
- Daftar mata kuliah menyediakan ruang untuk panel detail di desktop dan seluler
  agar isi daftar tetap dapat dijangkau.
- Tombol `Escape` menutup filter desktop dan mengembalikan fokus ke tombol
  pembukanya tanpa mengganggu penutupan pilihan filter yang sedang terbuka.
