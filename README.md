# EduPlan AI — GitHub Pages + Google Apps Script

## Status paket
Kode lengkap untuk pilot/penggunaan terbatas, belum situs yang telah online.
Frontend: HTML/CSS/JavaScript biasa, tanpa library atau build step.
Backend: Google Apps Script dengan REST JSON melalui doPost.
Login: hanya email yang aktif pada sheet Email, TANPA password/OTP.

## PERINGATAN KEAMANAN UTAMA
Login email saja hanyalah whitelist, BUKAN verifikasi identitas. Siapa pun yang mengetahui atau menebak email terdaftar dapat masuk sebagai pemilik email itu. Hal ini juga berlaku pada ADMIN. Token sesi dan pemeriksaan peran tidak memperbaiki kelemahan login awal ini.
Email admin yang sulit ditebak atau URL yang tidak disebarkan bukan pengganti autentikasi. Jangan gunakan versi ini untuk dokumen rahasia atau data pribadi siswa. Endpoint publik tidak memiliki CAPTCHA, pengendalian bot, rate limit infrastruktur, atau pembatas tagihan uang. Pemanggil yang masuk sebagai admin dapat mengatur ulang kuota dan provider.
Untuk penggunaan produksi/publik, ganti login dengan Google Identity/OAuth terverifikasi server atau OTP, dan gunakan penyimpanan secret yang sesuai.

## Isi file
- index.html: kerangka halaman, memuat CSS dan JavaScript relatif.
- style.css: seluruh tampilan, responsif, tema terang/gelap.
- app.js: seluruh frontend. CONFIG.API_URL berada di bagian atas.
- Code.gs: seluruh backend, database, sesi, generator, administrasi, ekspor.
- appsscript.json: manifest izin backend.
- README.md: panduan ini.

## 1 — Buat backend BARU
Paket ini memiliki schema berbeda dari paket sebelumnya. Jangan mengganti kode database lama tanpa migrasi. Gunakan proyek Apps Script baru untuk pemasangan pertama versi ini.
1. Buat proyek Apps Script dengan akun Google pemilik.
2. Tempel seluruh Code.gs pada file Code di editor.
3. Project Settings > aktifkan Show appsscript.json manifest file. Tempel appsscript.json dari paket.
4. Simpan. Pilih fungsi setup_ di dropdown editor dan klik Run.
5. Setujui izin Google. setup_ membuat database Spreadsheet, folder Drive dan satu admin awal dari email akun pemilik.
6. Buka Execution log untuk alamat database/folder dan email admin.
7. Script Properties otomatis berisi DB_ID, FOLDER_ID, SESSION_SECRET. Jangan membagikan atau menghapusnya.
8. Jangan menjalankan setup_ lagi. Jangan membuat ulang database pada setiap deploy.
Tidak diperlukan file HTML, style.html, app.html, include(), atau google.script.run di Apps Script.

## 2 — Deploy backend
1. Deploy > New deployment > pilih Web app.
2. Execute as: Me (akun pemilik).
3. Who has access: Anyone, jika diizinkan akun/organisasi.
4. Deploy, lalu salin Web app URL yang berakhiran /exec.
5. Buka URL tersebut langsung. Respons normal adalah JSON berisi success:true dan status:online. Ini memeriksa endpoint, bukan kesehatan seluruh database.
6. Setelah perubahan backend: Deploy > Manage deployments > Edit > New version > Deploy. Menyimpan kode saja tidak memperbarui deployment produksi.
Jika opsi Anyone tidak tersedia, administrator Workspace dapat membatasinya. Pola fetch anonim dari GitHub Pages pada paket ini memerlukan akses deployment yang mendukungnya; jangan menganggap deployment login-Google terbatas domain akan bekerja tanpa penyesuaian autentikasi/transport.

## 3 — Konfigurasi frontend
Buka app.js dan ganti:

API_URL: 'https://script.google.com/macros/s/GANTI_ID_DEPLOYMENT_ANDA/exec'

menjadi URL /exec milik Anda. Jangan menaruh API key Gemini/OpenAI/Claude di app.js.
URL /exec memang terlihat publik. Jangan memperlakukannya sebagai password.

## 4 — Publikasikan GitHub Pages
1. Buat repository GitHub.
2. Unggah hanya index.html, style.css, app.js ke root repository (boleh juga folder khusus Pages sesuai konfigurasi Anda).
3. Settings > Pages > Deploy from a branch > pilih branch dan folder root.
4. Tunggu publikasi lalu buka URL GitHub Pages.
5. Login dengan email admin dari langkah setup.
Code.gs dan manifest disimpan di Apps Script, tidak perlu di repository frontend. Jangan unggah Spreadsheet, Script Properties atau file yang berisi key.

## 5 — Daftarkan email guru
Cara yang disarankan: Admin > Manajemen pengguna > tambah email, nama, sekolah, role=guru, aktif.
Atau edit sheet Email langsung, dengan header tetap:

id | email | name | role | active | school

id harus unik dan tidak kosong; email huruf kecil, unik; role guru/admin; active TRUE/FALSE. Jangan mengubah id atau email akun yang sudah memiliki dokumen. Untuk akun baru manual, buat id unik seperti guru-001. Akun admin pertama sudah dibuat setup_.
Hanya orang tepercaya boleh menjadi editor Spreadsheet. Mengubah role dalam database akan mengubah akses akun itu.

## 6 — Isi API provider
Admin > Pengaturan AI & kuota.
- Isi ID model yang memang tersedia pada akun provider.
- Isi API key baru, centang Aktifkan, Simpan.
- Tes koneksi menggunakan konfigurasi yang SUDAH DISIMPAN. Tes bisa dikenai biaya.
- Kolom key kosong mempertahankan key lama; centang Hapus key untuk menghapusnya. Untuk menghapus, nonaktifkan provider terlebih dahulu atau bersamaan.
- Gemini memakai generateContent; OpenAI memakai Responses; Claude memakai Messages dan header anthropic-version 2023-06-01.
- ID model tidak di-hardcode agar dapat diganti sesuai akun/kompatibilitas endpoint.
- Model harus mendukung endpoint dan parameter yang dikirim. Tidak semua model/ID dari provider kompatibel.
- Langganan aplikasi chat tidak otomatis sama dengan saldo/izin API.
Key disimpan TEKS BIASA dalam sheet Providers. Key tersimpan tidak dikembalikan ke frontend, tetapi editor database/proyek bisa membacanya. Ini bukan enkripsi. Untuk produksi gunakan secret manager.

## 7 — Struktur database
Email: akun guru/admin.
Providers: id provider, model, apiKey, enabled.
Documents: metadata dokumen dan fileId privat Drive, favorite, deleted, revision.
Sessions: hash token sesi, userId, expires. Token asli hanya diberikan sekali ke browser dan disimpan di sessionStorage.
Usage: percobaan generate per akun per hari WIB.
Settings: dailyLimit.
Logs: aktivitas yang berhasil dicatat (maksimum 200 terbaru ditampilkan).
Isi dokumen disimpan file teks privat di Drive. Guru tidak diberi akses folder/database; konten diambil melalui backend setelah pemeriksaan akses.

## 8 — Fitur aplikasi
Login email; guru/admin; dashboard; 40 generator; profil; riwayat; pencarian; filter jenis/provider; pagination di sisi browser; favorit; sampah dan pulihkan; editor judul/isi; cek konflik revisi saat menyimpan; salin; unduh TXT/PDF/Word; pengelolaan akun; provider; tes koneksi; kuota; log; panduan; tema terang/gelap; responsif.
Guru hanya dokumennya sendiri. Admin dapat mengelola seluruh dokumen. Favorit adalah atribut dokumen bersama (bukan favorit terpisah tiap admin/pembaca).
Sampah adalah soft-delete metadata. File sumber tidak dihapus permanen. Belum ada tombol hapus permanen.
Sesi berakhir setelah 6 jam, tidak diperpanjang otomatis. Penonaktifan akun diperiksa pada permintaan berikutnya, bukan membatalkan operasi yang sudah berjalan.

## 9 — Batas hasil dan workflow
Ke-40 generator memakai form konteks bersama, prompt dasar dan beberapa instruksi khusus per jenis; bukan 40 formulir administratif khusus.
CP/TP rujukan serta kalender resmi daerah tidak diambil otomatis. Tempelkan sumber terverifikasi.
Daftar hadir/nilai tanpa data harus berupa template. Analisis hasil tanpa data tidak menghasilkan hasil nyata. Validasi hitungan AI secara terpisah.
Presentasi berupa outline slide, bukan file PPTX. Media berupa naskah/storyboard, bukan gambar/video.
PDF/Word berbasis teks sederhana. Bukan renderer Markdown, tabel kompleks, kop surat atau tata letak slide.
Saat ekspor dibuat Google Doc perantara dan dipindahkan ke trash setelah selesai. Hasil unduhan tidak otomatis diarsipkan sebagai PDF/DOCX di folder sumber; file teks sumber tetap ada.
revision adalah nomor untuk mendeteksi konflik, BUKAN arsip versi lama. Dokumen yang ditimpa tidak punya menu rollback.
Belum ada upload lampiran, backup otomatis, antrean background, dashboard token/tagihan, maupun pemetaan data sekolah otomatis.

## 10 — Kuota, konkurensi, dan skala
Kuota 1–500 percobaan per pengguna per hari WIB; default 20. Kegagalan setelah reservasi kuota tetap dihitung.
Ada kunci penulisan Spreadsheet dan penanda satu generate per akun menggunakan cache. Cache bisa dihapus lebih awal; ini bukan jaminan idempotensi/exactly-once.
Pemanggilan AI sinkron, tunduk batas waktu/kuota Apps Script dan provider. Jangan menekan ulang atau refresh saat generate berjalan.
Jika API sudah sukses tetapi penulisan Drive/Sheets gagal, biaya dapat tetap terjadi dan file yatim bisa tertinggal. Tidak ada retry otomatis.
Aplikasi membaca tabel utuh lalu melakukan pagination di browser. Cocok pilot kecil; untuk trafik tinggi perlu pagination server, database dan sesi yang lebih sesuai, rate limiting dan antrean.
Sheet Sessions/Usage/Logs akan terus bertambah. Jalankan cleanupSessions_ dari editor untuk sesi kedaluwarsa (atau pasang trigger harian). Arsipkan Usage/Logs lama melalui proses pemeliharaan yang Anda kendalikan. Jangan menghapus baris sesi/usage aktif saat aplikasi digunakan.

## 11 — Troubleshooting
Respons bukan JSON: periksa URL /exec, bukan /dev/editor. Cek opsi akses Anyone dan redeploy versi baru.
Failed to fetch/CORS: uji dari URL GitHub Pages HTTPS, periksa tab Network/Console dan pengaturan akses. Request sengaja menggunakan Content-Type text/plain agar tidak memakai preflight application/json, serta mengikuti redirect ContentService. Tidak ada jaminan untuk semua kebijakan akun/browser. Jangan mengganti mode ke no-cors karena respons menjadi opaque dan tidak bisa dibaca. Menambah doOptions atau header palsu bukan solusi yang tersedia pada TextOutput standar; bila lingkungan tetap memblokir, gunakan proxy backend yang Anda kendalikan atau ubah deployment/transport secara terencana.
API HTTP 400/401/403/404/429: periksa model, key, izin, saldo, kuota di dashboard provider; jangan menampilkan key dalam tangkapan layar/log.
Operasi server gagal: pemilik memeriksa Executions/Execution log Apps Script; detail internal tidak dikirim ke browser.
Dokumen konflik: buka ulang dari riwayat. Salin perubahan lokal dahulu jika perlu.
Backend tidak menampilkan aplikasi: benar; aplikasi berada di GitHub Pages. GET /exec hanya endpoint status.
Frontend masih versi lama: hard refresh atau tunggu pembaruan Pages.

## 12 — Pemeriksaan yang telah dilakukan pembuat paket
- app.js dan Code.gs lulus pemeriksaan sintaks Node (bukan validasi runtime layanan Google).
- Nama tindakan frontend cocok dengan rute backend.
- Tidak ada include()/google.script.run pada frontend.
- Katalog berisi 40 jenis.
- 10 uji unit backend dengan mock: login terdaftar, case normalization, hash sesi, email tak terdaftar, akun nonaktif, pembatas admin, kepemilikan dokumen, akses admin, metadata tanpa fileId, sesi tidak dikenal.
Belum diuji live: deployment Google, CORS browser GitHub Pages, izin akun Google, ketiga provider API, ekspor PDF/Word dan responsivitas visual di perangkat nyata.

## 13 — Checklist sebelum dipakai
[ ] Login admin dan guru, akun tak terdaftar/nonaktif ditolak.
[ ] Guru A tidak dapat membaca/menyimpan/ekspor/trash dokumen Guru B dengan ID yang disalin.
[ ] Guru tidak dapat memanggil rute admin menggunakan tokennya.
[ ] Database/folder/proyek tidak dibagikan publik.
[ ] Setiap provider berhasil dites dan menghasilkan draf dengan model akun Anda.
[ ] Tinjau contoh semua jenis dan pastikan rujukan/angka tidak fiktif.
[ ] Editor, konflik dua tab, favorit, sampah, pulihkan bekerja.
[ ] PDF/DOCX/TXT bisa dibuka dan sesuai isi tersimpan.
[ ] Tema, menu seluler, pencarian dan filter berfungsi.
[ ] Sesi kedaluwarsa/logout/penonaktifan akun bekerja.
[ ] Kuota/timeout/koneksi gagal ditangani secara operasional.
[ ] Tentukan penanggung jawab privasi, anggaran, backup dan pemeliharaan.
