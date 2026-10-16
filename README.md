# Praya · katalog affiliate · versi 5

Paket ini disiapkan untuk repository GitHub yang dihubungkan ke Netlify. Website belum diterbitkan dan belum memiliki kredensial API Shopee.

## Pasang melalui GitHub dan Netlify

1. Ekstrak `praya-github-netlify.zip`. Unggah **isi** paket ke root repository GitHub, sehingga `netlify.toml`, `package.json`, `public/`, dan `netlify/` berada pada tingkat yang sama. Jangan unggah ZIP sebagai satu file. Jangan unggah `node_modules`, `.env`, atau folder kerja lain.
2. Pada Netlify, pilih **Add new project → Import an existing project → GitHub**, lalu pilih repository tersebut. Bila diminta, berikan akses hanya ke repository Praya.
3. Base directory: kosong jika paket ada di root. Build command: `npm run build`. Publish directory: `public`. Direktori fungsi `netlify/functions` dan versi runtime sudah diatur dalam `netlify.toml`.
4. Deploy. Halaman pengunjung ada di `/`; pengelolaan ada di `/kelola.html`. Katalog tetap bisa tampil sebelum API Shopee disetel.
5. Untuk menerbitkan perubahan produk, setel kunci pemilik seperti langkah berikut. Website menggunakan Netlify Blobs untuk menyimpan katalog bersama. Katalog yang telah diterbitkan akan dipakai lagi setelah deploy berikutnya; mengganti seed dalam repository tidak menimpa isi Blobs.

Rujukan: [Netlify: deploy dari repository](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [GitHub: unggah file](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

## Mendapatkan akses API Shopee

Izin diberikan oleh Shopee kepada akun affiliate pemilik. Izin filesystem Codex, repository GitHub, dan hosting Netlify tidak memberikan izin API Shopee.

1. Masuk ke [portal Shopee Affiliate Indonesia](https://affiliate.shopee.co.id/) dengan akun affiliate Anda.
2. Cari fitur **Open API/API** yang tersedia pada akun. Bila tersedia, ikuti pengajuan yang disediakan Shopee. Bila fitur tidak ada atau akses ditolak, hubungi bantuan Shopee Affiliate dari akun/aplikasi dan minta akses **Shopee Affiliate Open API**, terutama `productOfferV2`, untuk katalog Praya. Nama menu dan kelayakan akun Indonesia belum dapat dipastikan tanpa melihat akun Anda; tidak ada jaminan semua akun mendapat akses.
3. Siapkan URL website Praya serta tujuan penggunaan: menampilkan nama produk, foto, harga, rating, dan angka penjualan dari tautan produk affiliate. Pengajuan dan persetujuan tetap dilakukan melalui Shopee. API Seller/Open Platform tidak otomatis menggantikan akses Affiliate Open API.
4. Setelah disetujui dan memperoleh **App ID** serta **Secret**, simpan di pengaturan environment variables Netlify. Jangan menaruhnya dalam HTML, GitHub, atau chat. Kode sudah memakai penandatanganan permintaan dari fungsi server.

[Explorer resmi Shopee](https://open-api.affiliate.shopee.co.id/explorer/v2) mendokumentasikan `productOfferV2`, termasuk `imageUrl`, `priceMin`, `priceMax`, `ratingStar`, dan `sales`. Explorer bukan tombol pemberian izin API. Field lain seperti stok varian, ongkir, dan seluruh ulasan tidak otomatis tersedia melalui query ini.

## Pengaturan Netlify

Buat environment variables berikut agar tersedia pada **Functions** dalam konteks production, lalu deploy ulang. Atur juga pada deploy preview hanya jika Anda memang ingin mengizinkannya.

| Nama | Isi |
| --- | --- |
| `PRAYA_ADMIN_TOKEN` | Kunci pemilik acak, minimal 32 karakter; berbeda dari Secret Shopee |
| `SHOPEE_APP_ID` | App ID yang diberikan Shopee Affiliate |
| `SHOPEE_APP_SECRET` | Secret Shopee Affiliate |
| `PRAYA_AUTO_SYNC` | Mulai dengan `false`; ubah ke `true` setelah pengambilan satu produk berhasil |

Nilai nyata tidak disimpan dalam paket. `.env.example` hanya mencantumkan nama variabel. Bila perlu membuat kunci pemilik, gunakan pengelola kata sandi untuk membuat nilai acak panjang dan simpan sebagai `PRAYA_ADMIN_TOKEN` di Netlify.

Rujukan: [environment variables Netlify](https://docs.netlify.com/build/environment-variables/overview/).

## Mengelola dan memperbarui produk

1. Buka `/kelola.html`, pilih tombol Kelola. **Muat koleksi online** akan meminta kunci pemilik. Kunci hanya disimpan dalam memori tab, hilang ketika halaman dimuat ulang, dan dikirim ke fungsi Netlify milik situs ini untuk otorisasi.
2. Pada perangkat baru tanpa draf lokal, login pertama memuat koleksi lengkap. Bila sudah ada draf lokal, pilih Muat koleksi online untuk menggantinya setelah konfirmasi. Ekspor cadangan lebih dulu bila draf masih dibutuhkan.
3. Tambah/edit produk, tempel link affiliate, tandai sebagai tautan affiliate Anda. Saat API terhubung dan akses pemilik aktif, data bisa diambil otomatis setelah link ditempel, atau lewat **Ambil data dari Shopee**. Periksa hasil dan simpan.
4. **Terbitkan perubahan** menyimpan koleksi di Netlify Blobs. Pengunjung melihat perubahan setelah membuka ulang halaman. Tombol Unduh katalog hanya membuat salinan HTML, tidak menerbitkan perubahan online.
5. Bila koleksi telah berubah di server, penerbitan draf lama ditolak untuk menghindari penimpaan. Ekspor draf, muat koleksi online, lalu terapkan kembali perubahan yang masih diperlukan.
6. Jika `PRAYA_AUTO_SYNC=true` dan kredensial valid, fungsi terjadwal mencoba memperbarui produk affiliate setiap enam jam pada production deploy. Di WITA: 02.00, 08.00, 14.00, 20.00. Produk tersembunyi tetap tersembunyi; API tidak mengaktifkannya sendiri. Produk di Sampah tidak diperbarui.
7. Untuk katalog besar, pekerjaan dibagi dalam beberapa putaran dengan penanda posisi. Keberhasilan bergantung pada ketersediaan produk, batas API, jaringan, dan waktu eksekusi. Kegagalan satu produk mempertahankan data sebelumnya; pembaruan bukan jaminan data real-time.

Empat link affiliate Anda tersimpan sebagai draf pada seed server. Sebagian besar produk riset awal memakai tautan toko dan belum memiliki ID produk lengkap; tautan tersebut perlu diganti dengan tautan affiliate produk yang tepat agar dapat disinkronkan. Link affiliate asli tetap dipakai untuk CTA; integrasi ini tidak menggantinya dengan link dari API.

Bagian Paling laris diurutkan dari `sales` pada produk aktif dalam koleksi yang memiliki angka penjualan. Ini bukan peringkat seluruh Shopee atau bukti closing dari akun Praya. Selama angka penjualan belum tersedia, bagian tersebut memakai kurasi manual dengan keterangan yang terlihat. Daftar kurasi diatur melalui checkbox pada Edit produk.

Rujukan: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/), [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/).

## Harga coret, promo, dan stok

Editor produk memiliki kolom harga sebelum promo, sumber informasi, tanggal pemeriksaan, waktu akhir promo, dan stok yang tercatat. Harga coret harus lebih tinggi dari harga saat ini dan memiliki sumber serta tanggal cek. Gunakan harga untuk varian yang sama. Data ini belum diisi pada seed karena belum tersedia harga asal, stok, atau masa promo yang terverifikasi.

Harga coret dan stok hanya ditampilkan dalam jendela pemeriksaan 48 jam. Promo yang waktunya sudah lewat tidak lagi menampilkan harga coret atau penanda waktu. Stok tercatat 0–5 diberi penanda; jumlahnya tidak dibuat otomatis. Pembaruan tampilan pengunjung setiap menit mengevaluasi kembali masa berlaku. Ini bukan penghitung waktu yang diulang untuk menciptakan kelangkaan.

`priceMax` dari API merupakan harga maksimum produk dan tidak dipakai sebagai harga sebelum diskon. Integrasi meminta `priceDiscountRate` jika tersedia, tetapi tidak menebak harga asal dari angka tersebut. Harga asal yang valid bisa dimasukkan di admin.

## Banner bergerak

Banner menampilkan produk teratas dengan jeda baca sebelum bergeser dalam loop. Tombol Jeda gerak menghentikannya. Gerakan juga berhenti saat diarahkan/fokus pada banner atau tab tidak terlihat. Preferensi reduced motion mematikan animasi dan menyisakan daftar yang bisa digeser. Tidak ada klik Shopee otomatis.

## Pengunjung, statistik, dan admin

`/` adalah halaman pengunjung. `/kelola.html` adalah halaman admin, dengan permintaan kunci pemilik untuk operasi server. Pada versi file mandiri, `praya-pengunjung.html` dan `praya-kelola.html` menyediakan preview masing-masing; statistik lintas perangkat baru tersedia setelah fungsi server dipasang di Netlify.

Dashboard menampilkan tayangan halaman, sesi terukur, klik ke Shopee, klik sponsor, produk paling banyak diklik, dan sumber/kampanye untuk 7 atau 30 hari. Angka hanya mewakili event yang berhasil diterima, bukan pesanan atau komisi Shopee. Sesi memakai ID acak per tab dan diperbarui setelah 30 menit tanpa aktivitas; ini bukan jumlah orang unik yang terverifikasi. Admin tidak dihitung sebagai kunjungan publik.

Event dicatat sebagai rekaman terpisah di Netlify Blobs, bukan melalui counter read-modify-write. Event yang sama pada hari yang sama tidak dihitung ulang. Statistik dibatasi pada sampel maksimal 5.000 event per pemuatan dan menampilkan keterangan jika batas tercapai. Data historis tidak dihapus otomatis oleh paket ini. Untuk traffic besar, gunakan layanan analitik khusus atau rancangan agregasi terpisah.

Sistem tidak menyimpan alamat IP, email, atau identitas Shopee pada rekaman analitik. Hanya waktu, jenis event, kode produk, ID sesi yang di-hash, dan sumber kampanye. Browser dengan Do Not Track/Global Privacy Control serta pengunjung yang mematikan pengukuran melalui Informasi katalog tidak dicatat. Penyaringan bot dasar bukan jaminan penyaringan seluruh traffic otomatis.

Contoh tautan iklan masuk: `https://domain-praya-anda/?utm_source=instagram&utm_medium=paid_social&utm_campaign=outfit_oktober`. Untuk kunjungan tanpa UTM, hostname perujuk dipakai jika tersedia; sisanya ditandai tanpa UTM. Tidak ada Meta Pixel, Google Analytics, atau skrip iklan eksternal yang terpasang.

## Slot sponsor

Bagian Iklan & kerja sama di admin mengatur satu slot sponsor di bawah katalog: aktif/nonaktif, judul, deskripsi, gambar, CTA, dan link HTTPS. Simpan sebagai draf, lalu Terbitkan perubahan. Slot ditandai Iklan · Kerja sama dan tautannya memakai rel sponsored. Klik sponsor dicatat terpisah.

Slot bawaan nonaktif. Tidak ada banner kosong pada halaman pengunjung. Ini dukungan sponsor langsung; Google AdSense atau jaringan iklan lain belum dihubungkan. Statistik dan slot sponsor tidak memerlukan akses API Shopee.

## Desain dan pemeriksaan

Grid Swiss yang ringkas, tanpa gradient atau jarak huruf dekoratif. Manrope dipakai untuk isi dan antarmuka; Marykate untuk tagline #PRAYAanstylemu! di awal dan akhir halaman. Logo transparan biru/putih mengikuti tema. Font disimpan lokal. Lisensi OFL Manrope disertakan; Marykate berasal dari berkas pengguna dan tidak disertai dokumen lisensi dalam lampiran.

Pencarian kode, CTA langsung dengan area sentuh 44 px, logo, mode terang/gelap, validasi harga coret, tombol jeda, dashboard admin, dan layout diperiksa pada lebar 320, 390, 768, serta 1280 px. Alur login, penerbitan, dan pemisahan produk publik/draf diuji pada simulasi lokal penyimpanan server. Dua puluh tiga pemeriksaan fungsi lolos; entrypoint Netlify dan SDK dapat dimuat. Build lolos. Koneksi Netlify Blobs sungguhan, deploy Netlify, dan API Shopee sungguhan belum diuji karena akses akun dan kredensial belum tersedia.

Perintah untuk pengembang: `pnpm install --frozen-lockfile`, `npm test`, `npm run build`, `npm run preview`. Preview lokal menggunakan penyimpanan sementara dalam memori; setel kunci pemilik pada `.env` lokal jika ingin menguji admin. `.env` tidak boleh diunggah ke GitHub. Runtime produksi diatur Node 22; pemeriksaan lokal dijalankan dengan runtime Node yang tersedia dalam workspace.
