# Audit cakupan silabus dan peta minat Ilkom 2026

Sumber: PDF FMIPA 2026 yang tersimpan di repo, SHA-256 `ffa6d141c99228b79092d9da647f47e9b37d2966f6aca8ca9567de8b7a506520`. Nomor PDF di bawah bersifat 1-based; halaman cetak = nomor PDF − 18.

## Cakupan silabus

- Bagian Ilkom, PDF 210–238: **89 entri bernomor 1–89, 88 kode unik, 0 entri terlewat**.
- Duplikat tunggal: `PACS262413` Pembelajaran Mesin, nomor 21 dan 58, PDF 217 dan 229. Kedua isi disimpan terpisah.
- Bagian umum, PDF 39–44: 18 kode tambahan. Total dataset 2026: **106 kode silabus**.
- Tabel kurikulum berisi 108 kode unik. Sebanyak **97 cocok langsung** dengan kode silabus, sementara **11 belum memiliki pasangan langsung**. Jadi 89 entri sumber lengkap tidak berarti semua matkul aplikasi sudah memiliki silabus.

Parser kini menangani tanda kurung dalam judul, kode pendek, judul tanpa akhiran SKS, dan label referensi tanpa titik dua. Data 2021 ikut diekstrak ulang dari rentang sumber yang sama dan kini berisi 160 kode; konflik kode berbeda judul tetap dikecualikan.

[Audit JSON](../output/data/ugm-ilkom-2026-syllabus-audit.json) menyimpan setiap nomor 1–89 dan halaman asalnya.

## Sebelas kode tanpa pasangan langsung

| Kode tabel | Mata kuliah | Hasil audit |
| --- | --- | --- |
| `UNKU26000X` | Agama (dipilih sesuai agama masing- masing) | Kode pilihan agama generik; bukan satu silabus mata kuliah tertentu. |
| `UNKU260015` | Komunikasi Masyarakat** | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `UNKU260016` | Penerapan Manajemen Pengetahuan** | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262611` | Proposal Tugas Akhir | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262701` | Seminar Tugas Akhir | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262702` | Tugas Akhir | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262422` | Temu Balik Informasi | Judul sama ditemukan dengan kode `PACS262008` di PDF 222; tidak dialias otomatis. |
| `PACS262505` | Kajian Literatur | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262507` | Kapita Selekta Algoritma dan Komputasi | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262604` | Kapita Selekta Sistem Cerdas | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |
| `PACS262509` | Kapita Selekta Sistem Komputer dan Jaringan | Tidak ditemukan sebagai heading silabus pada rentang PDF 39–44 dan 210–238. |

Tidak ditemukan pada rentang ini bukan bukti bahwa suatu mata kuliah tidak memiliki silabus resmi di dokumen lain. Kode tidak ditebak atau dipadankan otomatis berdasarkan nama.

## Ekstraksi peta minat

PDF 200 / cetak 182 adalah peta wajib umum (Gambar 3.7). Enam peta minat berada di PDF **201–206**, bukan 200–205. Gambar raster dibaca secara visual.

[Dataset peta minat](../output/data/ugm-ilkom-2026-interest-maps.json) menyimpan **57 penempatan matkul minat**, semester, SKS, WM/P, blok pilihan, catatan pemilihan, dan slot international exposure. Diagram menampilkan nama tanpa kode; kode dicocokkan ke judul pada Tabel 3.12 dengan rujukan halaman tabel.

| Minat | PDF / cetak | Matkul bernama pada diagram | SKS WM | Baris tabel yang tidak disebut pada diagram |
| --- | --- | ---: | ---: | ---: |
| Analisis Data | 201 / 183 | 7 | 9 | 0 |
| Komputasi Cerdas | 202 / 184 | 15 | 10 | 1 |
| Kecerdasan Artifisial | 203 / 185 | 10 | 15 | 1 |
| Rekayasa Perangkat Lunak | 204 / 186 | 7 | 12 | 1 |
| Infrastruktur Komputasi | 205 / 187 | 8 | 12 | 0 |
| Wirausaha Digital | 206 / 188 | 10 | 15 | 4 |

Seluruh 25 matkul/penempatan WM dari enam kelompok tabel tercakup. Ada tujuh baris P pada tabel yang tidak dinamai di diagram terkait; rinciannya ada di `table_courses_not_named_in_diagram`. Ini bukan berarti matkul tersebut dilarang untuk minat itu.

### Perbedaan diagram dengan tabel

| Minat | Kode | Field | Diagram | Tabel |
| --- | --- | --- | ---: | ---: |
| Kecerdasan Artifisial | `PACS262420` | semester | 6 | 4 |
| Kecerdasan Artifisial | `PACS262503` | semester | 7 | 5 |
| Infrastruktur Komputasi | `PACS262415` | semester | 6 | 4 |
| Infrastruktur Komputasi | `PACS262530` | semester | 7 | 6 |
| Wirausaha Digital | `PACS262506` | credits | 2 | 3 |
| Wirausaha Digital | `PACS262511` | semester | 7 | 5 |
| Wirausaha Digital | `PACS262510` | semester | 7 | 5 |

Perbedaan umum lain: label KKN di diagram adalah 8 SKS, sementara tabel memakai 4 SKS. Heading silabus Keterampilan Masa Depan Berkelanjutan (`UNKU260013`, PDF 42) menyebut 2 SKS, sementara tabel dan diagram menyebut 3 SKS. Nilai yang berbeda tetap disimpan sebagai fakta sumber, bukan dianggap koreksi otomatis.

### Batas hasil peta

- Ini transkripsi blok minat; node wajib bersama dan seluruh panah prasyarat belum ditranskrip ke dataset ini.
- Semester adalah penempatan rencana, bukan janji penawaran kelas.
- Blok pilihan generik dan pengulangan jalur tugas akhir tidak dihitung sebagai matkul wajib tambahan.
- Aplikasi tetap memakai tabel kurikulum yang sudah ada. Dataset diagram belum dipakai untuk menimpa solver, prasyarat, kredit, atau UI peta.

## Mengulang pemeriksaan

```powershell
python scripts/extract-syllabi.py
bunx oxfmt src/data/syllabi.json
python scripts/audit-syllabi-2026.py
bunx oxfmt output/data/ugm-ilkom-2026-syllabus-audit.json
python -m unittest discover -s scripts -p test_extract_syllabi.py
bun test src/data/syllabi.test.ts src/data/interest-maps-2026.test.ts
```

Transkripsi diagram bersifat manual; ulangi pemeriksaan visual jika PDF sumber berubah.
