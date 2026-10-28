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

### 2026-10-28

#### Added

- Halaman Arsip Ujian dengan navigasi folder mata kuliah dan tahun, pencarian nama
  mata kuliah, serta pratinjau PDF Google Drive dalam modal AlignUI. Koleksi awal
  memuat seluruh 102 mata kuliah dan 1.613 entri berkas dari arsip Himakom UGM,
  termasuk gambar dan dokumen Word. Daftar menampilkan tanggal dibuat dan jenis
  folder/berkas dengan pemisah baris yang ringan dan tanggal relatif. Header tabel
  diringkas, kolom tanggal, ujian, dan jenis disejajarkan ke tengah, jenis
  folder/berkas ditampilkan sebagai badge, UTS dan UAS dibedakan dengan badge
  berwarna di semua ukuran layar, dan ringkasan item serta tautan sumber di footer
  dihapus.
  Berkas tanpa tahun eksplisit dikelompokkan dalam “Tanpa tahun”; metadata yang
  meragukan dicatat untuk tinjauan manusia.
- Tautan folder dan berkas Arsip Ujian dapat dibagikan, dengan pemulihan lokasi
  melalui Back/Forward. Modal berkas menyediakan aksi ikon untuk unduh, salin tautan
  aplikasi dengan animasi konfirmasi, buka di Drive, dan tutup modal.

#### Changed

- Posisi awal judul dan tombol CS UGM Roadmap pada peta rata kiri di sepertiga
  atas layar, dengan margin kiri lebih lapang dan tampilan awal diperbesar.

- Hasil kuis roadmap diawali layar pemuatan dengan animasi rute mata kuliah
  minimal 1,5 detik; preferensi pengurangan gerakan menampilkan ilustrasi statis.
- Tombol kembali ke peta kurikulum memakai gaya netral berbingkai seperti toggle tema;
  breadcrumb “Arsip Ujian” disembunyikan di folder root agar judul tidak berulang.
  Navigasi folder memakai komponen Breadcrumb AlignUI dengan tautan folder.
  Pencarian mata kuliah rata kanan dengan placeholder “Mata kuliah” dan tetap
  tersedia di dalam folder; mengetik pencarian membuka hasil mata kuliah di root.
- Warna hover baris Arsip Ujian memakai CSS Tailwind tanpa pembaruan seleksi
  JavaScript saat pointer bergerak; navigasi keyboard tetap tersedia.

- Pemuatan awal lebih ringan: data kurikulum dinormalisasi saat build, detail dan
  silabus dimuat sesuai kebutuhan, serta hasil roadmap dimuat setelah kuis selesai.
  Animasi peta mengurangi pembaruan React; aset bernama hash disimpan di cache
  untuk kunjungan berikutnya. Pengunduhan detail, silabus, atau hasil roadmap yang
  gagal menampilkan pilihan muat ulang tanpa menghilangkan halaman lain. Indikator
  pemuatan detail ditutup saat pilihan mata kuliah dibatalkan.

#### Fixed

- Pintasan keyboard mengabaikan kombinasi Shift yang tidak ditetapkan.

- Tombol pada detail mata kuliah merespons klik pertama setelah panel diseret
  pada perangkat dengan input sentuh dan mouse.

### 2026-10-27

#### Changed

- Tombol utama "Buat roadmap kuliah" menggunakan AlignUI FancyButton berwarna primer
  agar lebih menonjol.

- Label kategori mata kuliah "Wajib program studi" disingkat menjadi "Wajib".

### 2026-10-26

#### Added

- Tombol salin ID mata kuliah di samping tombol tutup detail, dengan tooltip dan
  animasi centang setelah berhasil disalin. Tooltip dan ikon salin dibuat ringkas.

- Favicon diagram simpul dari Remix Icon, monokrom mengikuti tema sistem.
- Transkripsi enam peta minat kurikulum 2026 (PDF 201–206), termasuk semester,
  SKS, status WM/P, blok pilihan, dan perbedaannya dari tabel sumber.
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

- Tipografi mengikuti skala AlignUI. Hierarki judul bagian detail mata kuliah diperjelas.
- Filter target selesai memakai pilihan 7/8 semester. Tombol kembali dan reset
  berada di overlay, kontrol tema berdekatan dengan bagikan, dan catatan roadmap
  dibuka sebagai modal. Ikon bagikan berubah menjadi centang setelah tautan disalin.
- Petunjuk keyboard kuis memakai ikon untuk tombol navigasi dan Enter; pintasan
  panah kanan tetap berfungsi tanpa ditampilkan.
- Judul dan subjudul menggunakan Geist Variable, sedangkan teks isi dan label
  menggunakan Inter Variable. Kedua font disertakan dalam aplikasi.
- Tampilan awal peta kurikulum dan roadmap berpusat pada judul, dengan jarak
  lebih lega sebelum isi graf; pengguna dapat menavigasi ke mata kuliah.

- Detail mata kuliah menampilkan kredit sebagai angka dalam lingkaran di samping
  judul, dengan kategori di bawahnya dan tanpa terjemahan bahasa Inggris.
  Semester anjuran terlihat sebagai garis delapan titik tanpa judul tambahan.
  Silabus dan prasyarat dipisahkan dengan garis. Label versi kurikulum di header
  dihapus; kode mata kuliah tetap ditampilkan.

- Sheet detail mobile dapat diseret dari seluruh panel; konten tetap bisa digulir
  pada tinggi 75%, dan seret turun dari posisi scroll teratas mengecilkan panel.
- Kartu mata kuliah pilihan memakai permukaan solid bernuansa biru, border lebih
  jelas, dan teks tegas agar tetap berbeda dari mata kuliah utama.
- Tombol "Tampilkan mata kuliah" dan "Tampilkan roadmap" dihapus karena filter
  langsung diterapkan. Panel filter mobile ditutup lewat tombol silang di header.
- Sudut atas drawer mobile menggunakan radius 10px, mengikuti tombol. Detail mata kuliah di roadmap mobile juga tampil sebagai panel bawah.
- Pemilihan versi kurikulum menggunakan tab, dengan tipografi pilihan filter
  yang lebih konsisten.
  ([1da33de](https://github.com/Andhiki/g-13/commit/1da33de0c5fc3c6e6e04bc3e3f0bf9816ca6b315))
- Filter desktop berpindah ke toolbar pada tampilan daftar. Perpindahan antara
  peta dan daftar dianimasikan sambil mempertahankan keadaan filter terbuka.

#### Fixed

- Seluruh baris mata kuliah pada tampilan daftar membuka detail saat diklik,
  termasuk kode, SKS, kategori, dan ruang kosong di dalam baris.
- Handle sheet tidak lagi menampilkan outline saat terfokus; navigasi keyboard
  ditandai warna handle. Gesture drag tetap berjalan saat daftar memperbarui posisi scroll.
- Detail mata kuliah di roadmap tidak lagi memburamkan dan menghalangi interaksi
  dengan peta di belakangnya.
- Ekstraksi silabus mencakup mata kuliah umum, kode pendek, judul dengan tanda
  kurung, dan judul tanpa akhiran SKS. Seluruh 89 entri silabus Ilkom 2026 kini
  terwakili; audit memisahkan 88 kode unik dari cakupan 108 kode matkul di tabel.
- Silabus Pembelajaran Mesin 2026 kembali tersedia. Dua versi dalam PDF sumber
  dipertahankan dengan halaman masing-masing, alih-alih dihapus karena kode berulang.
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
