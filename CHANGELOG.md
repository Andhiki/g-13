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

- Tombol FAQ di samping Arsip Ujian membuka modal dengan jawaban dalam accordion
  tentang peta kurikulum, filter, roadmap kuliah, dan arsip ujian. Kedua tautan
  navbar memakai komponen dan warna teks redup yang sama, dengan ukuran teks
  dan warna pada LinkButton tidak saling menimpa.

- Header tetap di seluruh aplikasi dengan logo OmahTI dan HIMAKOM UGM yang
  mengarah ke beranda, tautan Arsip Ujian, tombol Roadmap berlatar putih dengan teks gelap,
  dan pengalih tema. Tautan navigasi memakai warna teks redup. Kontrol peta tetap
  berada di overlay di bawah header.

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

- Hasil roadmap menampilkan tooltip pada tombol coba lagi dan catatan. Tombol
  catatan hanya memakai ikon, dengan hierarki tipografi yang lebih jelas di modal.

- Tampilan daftar kurikulum dibuat lebih sempit dan padat dengan tinggi baris
  standar 40 piksel, dengan jarak tambahan
  di bawah gradasi overlay agar judul tetap terbaca, termasuk saat navigasi semester.
  Judul halaman diperbesar, antarsemester dipisahkan dengan garis dan jarak,
  serta kolom SKS dipindahkan ke paling kanan. Jumlah keseluruhan mata kuliah
  dihapus dan kode mata kuliah dapat disalin lewat tombol di sebelah kiri kode,
  dengan toast AlignUI saat penyalinan berhasil. Semua aksi salin, termasuk ID
  pada drawer mata kuliah, tautan roadmap, dan tautan arsip ujian, menampilkan
  toast keberhasilan yang sama. Tombol salin juga menampilkan tooltip AlignUI
  saat diarahkan atau difokuskan.

- Nama tampilan mata kuliah Agama 2026 disingkat menjadi “Agama” tanpa keterangan dalam kurung.

- Node mata kuliah di peta dan hasil kuis roadmap menjadi kartu sederhana dengan
  judul lebih besar tanpa kode dan SKS saat zoom di bawah 70%.

- Tampilan awal hasil kuis roadmap rata kiri mengikuti posisi dan skala awal peta utama.

- Halaman Arsip Ujian menampilkan atribusi “Provided by Himakom UGM” dengan
  tautan situs Himakom di bawah judul.

- Judul beranda diperbarui menjadi “Everything CS UGM” dan teks tombol utama
  menjadi “Buat roadmap sendiri”.

- Tombol ganti tampilan peta/daftar menampilkan tooltip AlignUI untuk tampilan
  tujuan dan memakai ikon tampilan tujuan yang berputar
  saat ditekan; preferensi pengurangan gerakan menonaktifkan putaran.

- Peta kurikulum dan hasil kuis roadmap menampilkan koneksi wajib secara default
  melalui segmen lurus dengan sudut membulat seragam dan satu titik sambungan
  tetap di setiap sisi node. Jalur vertikal yang rentangnya bertumpang tindih
  memakai lajur terpisah dengan jarak minimal 6 piksel dan tetap menghindari kartu.
  Koneksi antar mata kuliah pada semester yang sama disembunyikan dari kedua
  grafik, termasuk saat mata kuliah dipilih; informasi prasyarat tetap tersedia
  di detail mata kuliah.
  Hover atau fokus keyboard mempertegas semua koneksi terkait secara bersamaan
  dengan fade masuk/keluar singkat, termasuk koneksi pilihan. Hover menampilkan
  aliran renggang tiga partikel per koneksi. Titik sambungan hanya tampil ketika
  ada garis yang terlihat pada sisi tersebut, termasuk saat hover. Animasi mengikuti preferensi
  pengurangan gerak.

- Tabel Arsip Ujian diberi bingkai dan tinggi mengikuti ruang layar, dengan gulir
  di dalam daftar; breadcrumb root selalu tampil sebagai `~` (direktori home),
  dan ikon folder memakai warna abu-abu redup.

- Teks tombol utama roadmap memakai warna gelap pada tema gelap agar kontras
  dengan latar jingga yang terang.

- Bagian Silabus pada drawer mata kuliah terbuka secara default dan tetap dapat
  ditutup.

- Gambar logo header memakai `@unpic/react` dengan ukuran tetap agar ruangnya
  tersedia sebelum gambar selesai dimuat dan tata letak tidak bergeser.

- Posisi awal judul dan tombol CS UGM Roadmap pada peta rata kiri di sepertiga
  atas layar, dengan margin kiri lebih lapang dan tampilan awal diperbesar.

- Hasil kuis roadmap menampilkan layar pemuatan hanya selama hasil dimuat, tanpa
  jeda minimum. Animasi rute bergerak berulang, simpul memantul, dan teks berdenyut;
  preferensi pengurangan gerakan menampilkan ilustrasi dan teks statis.
- Tombol kembali ke peta kurikulum memakai gaya netral berbingkai seperti toggle tema;
  breadcrumb “Arsip Ujian” disembunyikan di folder root agar judul tidak berulang.
  Navigasi folder memakai komponen Breadcrumb AlignUI dengan tautan folder.
  Pencarian mata kuliah rata kanan dengan placeholder “Mata kuliah” dan tetap
  tersedia di dalam folder; mengetik pencarian membuka hasil mata kuliah di root.
- Baris Arsip Ujian memakai tombol native dengan hover dan fokus keyboard melalui
  CSS, tanpa seleksi baris otomatis atau pembaruan gaya melalui JavaScript.

- Pemuatan awal lebih ringan: data kurikulum dinormalisasi saat build, detail dan
  silabus dimuat sesuai kebutuhan, serta hasil roadmap dimuat setelah kuis selesai.
  Animasi peta mengurangi pembaruan React; aset bernama hash disimpan di cache
  untuk kunjungan berikutnya. Pengunduhan detail, silabus, atau hasil roadmap yang
  gagal menampilkan pilihan muat ulang tanpa menghilangkan halaman lain. Indikator
  pemuatan detail ditutup saat pilihan mata kuliah dibatalkan.

#### Fixed

- Jalur koneksi grafik memakai jarak aman yang konsisten agar dapat melewati
  celah antarbaris, termasuk koneksi Jaringan Komputer ke Praktikum Sistem Operasi
  dan Jaringan yang sebelumnya memutar jauh di atas kolom.

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
