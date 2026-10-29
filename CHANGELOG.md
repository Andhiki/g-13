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

### 2026-10-29

#### Added

- Proyek trailer Remotion dengan panduan pratinjau dan ekspor video `trailer.mp4`.

- Halaman kesalahan dan halaman tidak ditemukan dengan ilustrasi dan tombol navigasi.

- Helpful Resources menambahkan roadmap Computer Science dari roadmap.sh dan
  KKN Automation untuk presensi harian serta presensi proker melalui GitHub Actions.

- Baris `..` pada folder arsip ujian untuk naik satu tingkat ke folder induk.

#### Changed

- Tombol filter tetap di bawah pencarian saat berganti tampilan peta dan daftar.
  Tata letak kedua kurikulum beserta tampilan fokus disiapkan sekali saat halaman
  dimuat; peta tetap terpasang agar pergantian tampilan tidak mengulang pengukuran
  atau perhitungan jalur.

- Urutan mata kuliah dalam setiap kolom semester mendekatkan mata kuliah yang
  terhubung agar jalur prasyarat lebih pendek, tanpa mengubah semester atau
  pengelompokan mata kuliah pilihan.

- Kontrol zoom lebih ringkas dan disembunyikan saat detail mata kuliah terbuka;
  pintasan keyboard dapat dilipat lewat tombol keyboard dengan animasi seperti filter.
  Tombol ganti tampilan mengikuti sudut tombol lainnya.

- Jalur prasyarat lebih rapat dan simetris, dengan pertemuan jalur yang menuju
  atau berasal dari mata kuliah yang sama. Tampilan peta dipulihkan tanpa jeda
  tambahan saat detail ditutup.

- Perhitungan jalur koneksi peta kurikulum dan roadmap berjalan di latar belakang
  agar interaksi tetap responsif saat grafik disiapkan.

- Peta kurikulum dan roadmap menyiapkan jalur mata kuliah pilihan saat grafik
  dimuat, sehingga hover tidak menghitung ulang jalur koneksi.

- Judul tautan roadmap komputer di Helpful Resources kini menggunakan nama
  `roadmap.sh`, dan deskripsi sumber belajar kini berbicara lebih langsung
  kepada pembaca.

- Terjemahan Indonesia dan Inggris mencakup judul, ajakan bertindak, filter,
  pintasan keyboard, nama mata kuliah, detail, kuis dan catatan roadmap, arsip
  ujian, FAQ, alumni, sumber belajar, serta metadata halaman. Bahasa tersimpan
  dalam cookie agar hasil render server dan browser sama; kamus dimuat sesuai
  bahasa dan halaman yang dibuka. Pencarian arsip menerima nama Indonesia maupun Inggris.

- Kartu pintasan keyboard disembunyikan pada layar kecil.

- Halaman Helpful Resources berbicara langsung kepada pembaca dan menautkan
  template skripsi DIKE UGM yang diperbarui. Nama kursus CS50 tetap dalam bahasa
  Inggris pada kedua pilihan bahasa.

- Catatan roadmap 2021 kini menyebut bahwa perbedaan sumber lama tetap dicatat
  bersama data sumber.

#### Fixed

- Penyalinan tautan roadmap dan arsip ujian mengabaikan hasil penyalinan lama
  setelah pilihan berubah dan mempertahankan tautan awal saat penyalinan gagal.

- Posisi kedua peta dipulihkan setelah menutup detail mata kuliah, kecuali pengguna
  berpindah semester atau mengatur ulang tampilan.

- Pergantian bahasa mempertahankan halaman saat kamus gagal diunduh dan tetap
  berfungsi tanpa akses cookie. Alamat halaman dengan huruf besar/kecil yang
  berbeda memuat kamus terjemahan yang sesuai.

### 2026-10-28

#### Added

- Pengaturan bahasa Indonesia dan Inggris memakai paket terjemahan bersama yang
  dapat digunakan aplikasi web maupun API; pilihan bahasa dapat diganti dari header.

- Ikon hamburger menu seluler bertransisi menjadi tanda X saat navigasi dibuka
  dan kembali menjadi hamburger saat ditutup. Animasi mengikuti preferensi reduced motion.

- Halaman Meet Our Alumni menampilkan foto, angkatan, pengalaman terpilih, dan
  pencapaian alumni Ilmu Komputer UGM, dengan tautan ke profil LinkedIn.

- Halaman Helpful Resources menyajikan tautan belajar CS50, template skripsi,
  dan sumber arsip ujian Himakom UGM dalam daftar editorial berpemisah garis;
  tautan dapat dibuka di tab baru.

- Waktu pembaruan terakhir arsip ujian ditampilkan bersama atribusi Himakom UGM,
  dengan metadata terpusat yang diperbarui saat data arsip diadopsi. Pencarian mata
  kuliah juga menemukan nama dengan satu kesalahan ketik pada kata yang dicari.

- Kontrol zoom peta utama memakai tombol ikon perkecil, perbesar, dan reset ke
  tampilan awal, serta persentase zoom yang mengikuti posisi peta.

- Pintasan keyboard pada peta untuk berpindah semester, membuka atau menutup filter,
  mengganti tampilan, mencari mata kuliah, dan mengganti tema ditampilkan di atas kontrol zoom;
  ukuran teks label pintasan disesuaikan dengan tombolnya.

- Ringkasan singkat jawaban kuis di bawah judul hasil roadmap, berisi kurikulum,
  peminatan, target selesai, kegiatan, dan arahan untuk memeriksa catatan rencana.

- Tombol FAQ di samping Arsip Ujian membuka modal dengan jawaban dalam accordion
  tentang peta kurikulum, filter, roadmap kuliah, dan arsip ujian. FAQ menonjolkan
  sifat open source proyek dan mengajak kontribusi melalui issue atau pull request
  dengan tautan repositori GitHub. Kedua tautan
  navbar memakai komponen dan warna teks redup yang sama, dengan ukuran teks
  dan warna pada LinkButton tidak saling menimpa.

- Header tetap di seluruh aplikasi dengan logo OmahTI dan HIMAKOM UGM yang
  mengarah ke beranda, tautan Arsip Ujian, tombol Roadmap berlatar putih dengan teks gelap
  dan ikon rute, serta pengalih tema. Kedua logo berada dalam satu tautan beranda.
  Tautan navigasi memakai warna teks redup. Kontrol peta tetap
  berada di overlay di bawah header. Pada layar seluler, tombol menu membuka
  navigasi layar penuh ke kurikulum, arsip ujian, roadmap, dan FAQ dengan pengalih
  tema di bawah; menu mendukung Escape, pengelolaan fokus, dan penguncian gulir.
  Tombol ikon GitHub di samping pengalih tema pada desktop dan menu seluler
  membuka repositori proyek di tab baru.

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

- Filter kelompok pilihan dihapus; seluruh mata kuliah tetap tampil dengan
  pengelompokan pilihan pada peta dan pemilih versi kurikulum tetap tersedia.

- Mata kuliah pilihan pada peta utama dikelompokkan menurut kelompok pilihan,
  dengan kelompok Miscellaneous untuk mata kuliah tanpa kelompok. Bagian pilihan
  dipindahkan ke bawah semester dan disusun selebar delapan kolom semester,
  dengan judul bagian yang lebih besar untuk membedakannya dari nama kelompok.
  Setiap kelompok dibatasi enam mata kuliah per kolom; kelompok besar otomatis
  memakai kolom tambahan dan membungkus ke bawah dalam lebar delapan kolom.

- Kolom Semester 8 dan tombol navigasinya disembunyikan saat kosong.
- Slot pilihan kurikulum 2021 memakai nama “Mata Kuliah Pilihan” tanpa nomor,
  dan label versi di UI disingkat menjadi “2021 (rev. 2023)”.

- Paragraf pengantar singkat ditampilkan di bawah judul utama peta kurikulum.

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
  tautan situs Himakom dan waktu pembaruan data di bawah judul. Penjelajah folder
  memenuhi lebar layar pada ponsel tanpa padding luar.

- Judul beranda diperbarui menjadi “Everything CS UGM” dan teks tombol utama
  menjadi “Buat roadmap sendiri”.

- Tombol ganti tampilan peta/daftar berada di sebelah kiri pencarian pada desktop
  dan seluler, menampilkan tooltip AlignUI untuk tampilan
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

- Membuka atau menutup detail mata kuliah dari daftar mempertahankan posisi
  gulir.

- Menutup detail mata kuliah mengembalikan posisi dan zoom peta sebelum mata
  kuliah dibuka, termasuk setelah berpindah ke mata kuliah terhubung.

- Mata kuliah prasyarat dan lanjutan muncul bersamaan dengan koneksinya saat
  memilih mata kuliah di peta; jeda animasi node yang terpisah dihapus.

- Simbol font PDF yang tidak terbaca dihapus dari nama tampilan mata kuliah
  Indonesia dan Inggris, termasuk Skripsi, KKN, dan slot sertifikasi pada
  kurikulum 2021; teks sumber tetap disimpan.
  Sumber: [Kurikulum 2021 Revisi 2023, Tabel 3.26](https://simpan.ugm.ac.id/s/3LLHypTUeGoVDGH/download).

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
