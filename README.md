# Praya — admin login dan katalog spreadsheet (v6)

Katalog pengunjung berada di `/`. Login pengelola berada di `/login`, dan panel privat di `/admin`. HTML admin disimpan dalam modul server, bukan folder publik. API katalog privat, statistik, spreadsheet, dan penerbitan memeriksa sesi Netlify Identity dengan role `admin`. Kunci pemilik versi lama tidak lagi memberi akses.

## 1. Deploy melalui GitHub dan Netlify

1. Ekstrak paket ini. Unggah isinya ke repository GitHub milik Anda, termasuk `netlify.toml`, `public`, `netlify`, `scripts`, `tests`, `package.json`, dan `pnpm-lock.yaml`. Jangan unggah `.env`, kunci Google, atau kredensial Shopee.
2. Di Netlify pilih **Add new project → Import an existing project → GitHub**, lalu repository tersebut.
3. Gunakan folder proyek ini sebagai base directory; jika repository hanya berisi proyek ini, base directory kosong. Build: `npm run build`. Publish: `public`. Fungsi di `netlify/functions` sudah diatur.
4. Tunggu deploy HTTPS production selesai. Login sungguhan harus diuji pada deploy Netlify; preview lokal sengaja tidak menerima login atau menyediakan jalan pintas admin.

## 2. Aktifkan akun admin satu kali

1. Pada proyek Netlify, buka **Identity → Enable Identity**.
2. Buka **Registration → Registration preferences**, pilih **Invite only**. Website tidak menyediakan pendaftaran publik.
3. Di **Identity → Users**, undang email Anda sendiri. Ini langkah yang Anda lakukan di dashboard; proyek tidak otomatis membuat atau mengundang akun.
4. Pilih pengguna tersebut → **Edit settings → Roles** → tambahkan `admin`. Perubahan role berlaku pada login atau refresh token berikutnya. Jika akun belum terlihat sampai undangan diterima, terima undangan dahulu, tetapkan role di dashboard, lalu masuk kembali.
5. Buka undangan dari email dan buat kata sandi sendiri. Tautan undangan pada beranda otomatis diarahkan ke `/login`; undangan dan pemulihan kata sandi ditangani melalui SDK resmi.
6. Buka `https://DOMAIN-ANDA/login`. Setelah masuk sebagai admin, website membuka `/admin`.
7. Untuk pemulihan, pilih pengguna di dashboard Identity → **Send reset password email**. Website mendukung token pemulihan tersebut.

Sesi dikelola Netlify Identity. Kata sandi tidak disimpan dalam kode atau localStorage aplikasi. Role diperiksa server; menyembunyikan tombol bukan dasar keamanan. Ketika sesi berakhir, masuk kembali. Belum dilakukan uji login terhadap akun nyata karena proyek Netlify dan akun admin Anda belum terhubung.

Dokumentasi: [registrasi, undangan, dan CSRF](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/registration-login/), [pengaturan role](https://docs.netlify.com/manage/security/secure-access-to-sites/identity/manage-existing-users/).

## 3. Siapkan spreadsheet sebagai sumber katalog

1. Setelah masuk admin, pilih **Unduh format spreadsheet**. Format CSV memuat empat link affiliate yang sebelumnya Anda berikan, dengan status `sembunyi`; foto/harga/rating yang belum tersedia dibiarkan kosong.
2. Buat Google Sheets. Pilih **File → Import → Upload** dan impor CSV tersebut. Beri nama tab **Produk**.
3. Header baris pertama:

```text
kode,link_affiliate,status,kategori,nama,toko,foto,harga,rating,tanggal_cek,unggulan,acara,harga_awal,sumber_promo,cek_promo,promo_berakhir,sisa_stok
```

| Kolom | Isi |
| --- | --- |
| `link_affiliate` | Wajib. Link HTTPS Shopee asli; dipakai langsung sebagai tujuan CTA |
| `kode` | Disarankan, misalnya W07. Huruf kapital, angka atau tanda hubung; maksimal 14 karakter. Jika kosong dibuat kode stabil dari link |
| `status` | `aktif`, `sembunyi`, `habis`, `hapus`; kosong berarti aktif, tetapi produk belum lengkap akan ditahan tersembunyi |
| `kategori` | Wanita, Pria, Couple, Sepatu, Tas, Aksesori, Lainnya |
| `nama`, `toko`, `foto` | Lengkapi jika akses data Shopee belum tersedia. Foto berupa URL HTTPS yang dapat dibuka pengunjung |
| `harga`, `rating` | Angka, misalnya 99000 dan 4.8; tanpa Rp atau pemisah ribuan. Rating harus memiliki tanggal_cek |
| `tanggal_cek` | Tanggal verifikasi, format YYYY-MM-DD |
| `unggulan` | `ya` untuk pilihan pada banner; penjualan dari API dipakai jika tersedia |
| `acara` | Pisahkan dengan koma, misalnya Kuliah, Hangout |
| `harga_awal` | Harga pembanding nyata yang lebih besar dari harga saat ini |
| `sumber_promo`, `cek_promo` | URL sumber dan waktu cek untuk harga coret, promo, atau stok; contoh waktu `2026-10-17T10:00:00+08:00` |
| `promo_berakhir` | Waktu berakhir dengan zona waktu, jika benar-benar diketahui |
| `sisa_stok` | Bilangan bulat jika tersedia data stok yang diverifikasi |

Maksimal 1.000 produk. Jangan mengubah nama header. Ubah status ke `hapus` untuk menghapus secara terkendali; menghapus satu baris juga mengeluarkan produk dari website pada sinkronisasi berikutnya. Spreadsheet adalah sumber utama, sehingga sinkronisasi pertama mengganti daftar produk lama dengan daftar dalam spreadsheet. Spreadsheet kosong atau kesalahan baris membatalkan seluruh pembaruan dan mempertahankan katalog sebelumnya. Untuk mengosongkan katalog, gunakan status `hapus` pada semua baris.

Harga coret dan peringatan stok/promo hanya tampil jika sumber serta waktu cek valid dan masih segar (48 jam). Promo yang berakhir tidak ditampilkan sebagai promo aktif.

## 4. Hubungkan spreadsheet privat — disarankan

1. Di [Google Cloud Console](https://console.cloud.google.com/), pilih/buat proyek khusus Praya, lalu aktifkan **Google Sheets API**.
2. Buka **IAM & Admin → Service Accounts**, buat service account untuk membaca katalog. Tidak perlu memberi role Owner/Editor pada proyek Google Cloud dan tidak perlu domain-wide delegation.
3. Pada service account tersebut buka **Keys → Add key → Create new key → JSON**. Simpan kredensial di tempat aman. Jangan unggah file tersebut ke GitHub atau kirim melalui chat.
4. Pada Google Sheets, pilih **Share** dan tambahkan email `client_email` milik service account sebagai **Viewer**. Spreadsheet tetap berstatus **Restricted**; hanya spreadsheet yang dibagikan ini yang dapat dibaca akun layanan tersebut.
5. Di Netlify **Environment variables**, isi:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: nilai `client_email`.
   - `GOOGLE_PRIVATE_KEY`: nilai `private_key`, termasuk penanda BEGIN/END. Baris baru asli maupun bentuk literal `\n` didukung.
6. Terapkan variabel untuk runtime Functions production, lalu deploy ulang sesuai alur Netlify.
7. Masuk `/admin`, isi link Google Sheets normal, nama tab `Produk`, dan pilih **Privat · akses server**. **Simpan koneksi**, lalu **Sinkronkan sekarang**.

Server hanya meminta scope `spreadsheets.readonly`; tidak mengubah atau menulis balik isi spreadsheet. Foto/harga/rating hasil Shopee disimpan dalam katalog website. Edit produk sehari-hari tetap dilakukan melalui spreadsheet yang sama.

Dokumentasi: [service account Google](https://developers.google.com/identity/protocols/oauth2/service-account). Tidak ada kredensial Google di browser atau HTML publik.

### Alternatif tanpa kredensial Google

Jika tab produk memang boleh dibaca publik, atur file khusus katalog sebagai **Anyone with the link → Viewer**, kemudian pilih **Publik · Viewer** di panel admin. Gunakan file terpisah yang hanya berisi data katalog, tanpa data pribadi, komisi, atau laporan internal. Kode tidak mengubah izin berbagi Anda secara otomatis. Jika menggunakan mode privat, tidak perlu mengaktifkan berbagi publik.

## 5. Automasi website dan data Shopee

Alurnya: **Google Sheets → fungsi server terjadwal → penyimpanan katalog → website pengunjung**. Jadwal setiap 15 menit berjalan setelah deploy production Netlify. Tab pengunjung yang sedang terbuka memeriksa katalog setiap 60 detik; halaman baru membaca katalog online saat dibuka. Waktu tersebut merupakan jadwal pemeriksaan, bukan jaminan waktu selesai dari layanan eksternal.

Tombol **Sinkronkan sekarang** menjalankan alur yang sama. Panel menunjukkan pembaruan terakhir dan produk yang perlu dilengkapi. Jika ada kegagalan jaringan, akses, baris tidak valid, atau konflik pembaruan, katalog terakhir tetap dipakai.

Memasukkan link affiliate saja **tidak memberi akses otomatis ke seluruh detail Shopee**. Untuk mengambil foto, harga, dan rating melalui adapter resmi yang telah disiapkan, akses API Affiliate harus disetujui Shopee dan penawaran produk harus tersedia bagi akun Anda. Isi `SHOPEE_APP_ID` dan `SHOPEE_APP_SECRET` di environment Functions Netlify, bukan spreadsheet/chat. Setelah aktif, sinkronisasi mencoba memperkaya data melalui API. Maksimal beberapa produk diproses bersama dan ada batas waktu; koleksi besar bertahap pada jadwal berikutnya. Link CTA affiliate asli tetap dipertahankan.

Jika API belum tersedia, isi nama, toko, foto, harga, dan rating yang benar di spreadsheet. Produk tanpa nama/toko/foto disimpan tersembunyi. Tidak ada foto, rating, penjualan, atau diskon rekaan. Tidak ada scraping yang melewati CAPTCHA. API belum diuji dengan kredensial nyata milik Anda.

## 6. Statistik dan iklan

Admin melihat tayangan, sesi perkiraan, klik Shopee, klik iklan, produk paling diklik, dan sumber UTM. Angka klik bukan jumlah pesanan atau laporan komisi Shopee. Sistem menghormati DNT/GPC dan pilihan pengunjung. Data laporan dibatasi 5.000 event per rentang untuk menjaga respons; jika batas tercapai panel menyatakan data sampel.

Produk dikelola hanya dari spreadsheet setelah terhubung. Slot iklan tetap diatur di admin, dengan label Iklan/Kerja sama. Pilih **Terbitkan pengaturan iklan** untuk menayangkannya. Data katalog dan statistik tersimpan pada Netlify Blobs. Tidak perlu redeploy untuk perubahan produk sehari-hari.

## Validasi dan batas yang tersisa

Uji otomatis meliputi penolakan akses tanpa sesi, role admin, penolakan kunci lama, validasi URL dan CSV, draf link saja, perubahan link, sinkronisasi status/penghapusan, pengayaan metadata dengan respons uji, kegagalan sinkronisasi, konflik, privasi statistik, dan aturan promo. Login nyata, email undangan, izin Google Sheets privat, API Shopee nyata, dan jadwal production harus diverifikasi setelah akun serta spreadsheet Anda dihubungkan. Preview lokal menolak login dengan pesan yang jelas dan tidak menyimulasikan keberhasilan login.

Manrope disertakan dengan OFL. Marykate berasal dari berkas yang diberikan pemilik; pastikan lisensi publikasinya sesuai penggunaan website.
