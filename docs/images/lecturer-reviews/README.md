# Bukti tampilan ulasan dosen

Screenshot diperbarui dari build lokal setelah perapian formulir, kontrol, dan empty state.
Desktop: 1440 × 1000; mobile: 390 × 844. Tema terang.

- `directory-*.png`: direktori tanpa tombol tulis ulasan; penulisan dimulai dari detail dosen.
- `detail-*.png`: detail Afiahayati dengan ulasan, rating, dan suka sintetis lokal.
- `empty-*.png`: detail Aina Musdholifah tanpa ulasan.
- `write-*.png`: dialog dengan judul nama dosen, sakelar anonim aktif, dan draf sintetis yang tidak diterbitkan. Konten formulir dapat digulir pada ponsel.

Nama dosen dan katalog mata kuliah berasal dari data publik. Isi ulasan dan nama mahasiswa pada gambar adalah data demonstrasi, bukan penilaian dosen sebenarnya. Database lokal, identitas browser, dan secret tidak dipublikasikan. Pengambilan gambar tidak mengirim ulasan atau mengubah produksi.

Verifikasi lokal: `bun run check` (27 task berhasil, 117 tes web; hasil Turbo cache), `bun run build` (6 task berhasil), dan `git diff --check`. Interaksi dialog diperiksa pada desktop/mobile dengan tema terang/gelap: anonim aktif secara bawaan, pengisian nama setelah dinonaktifkan, retensi draf saat berganti anonim, pencarian mata kuliah, pemilihan semester/bintang, judul panjang, dan pembatalan tanpa pengiriman.

Hasil lokal bukan hasil CI GitHub. Peluncuran tetap membutuhkan D1 produksi, schema/seed, secret, dan penyelesaian #26; moderasi fase 2 tetap #27.
