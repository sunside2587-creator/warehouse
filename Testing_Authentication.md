# Laporan Pengujian Autentikasi API

Dokumen ini berisi hasil pengujian dari sistem autentikasi (JWT) yang baru saja diimplementasikan pada Backend (Express) dan Frontend (Vue 3).

## 1. Pengujian Endpoint `/api/login`

Endpoint ini digunakan untuk memvalidasi kredensial pengguna dan menerbitkan JWT token.

**Skenario A: Login Gagal (Password/Username Salah)**
- **Request:** `POST /api/login`
- **Body:**
  ```json
  {
    "username": "admin_gudang",
    "password": "wrongpassword123"
  }
  ```
- **Status Code:** `401 Unauthorized`
- **Response:**
  ```json
  {
    "message": "Username atau password salah."
  }
  ```

**Skenario B: Login Berhasil**
- **Request:** `POST /api/login`
- **Body:**
  ```json
  {
    "username": "admin_gudang",
    "password": "password123"
  }
  ```
- **Status Code:** `200 OK`
- **Response:**
  ```json
  {
    "message": "Login berhasil.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "username": "admin_gudang",
      "full_name": "Dimas Prakoso",
      "role": "admin"
    }
  }
  ```

---

## 2. Pengujian Endpoint Terproteksi (Contoh: `/api/products`)

Seluruh endpoint sekarang dilindungi oleh middleware `authenticateToken`.

**Skenario A: Akses Tanpa Token**
- **Request:** `GET /api/products`
- **Headers:** *(Tidak ada Header Authorization)*
- **Status Code:** `401 Unauthorized`
- **Response:**
  ```json
  {
    "message": "Akses ditolak. Token tidak ditemukan."
  }
  ```

**Skenario B: Akses Dengan Token Tidak Valid (Kadaluarsa/Salah)**
- **Request:** `GET /api/products`
- **Headers:** `Authorization: Bearer invalid_token_here`
- **Status Code:** `403 Forbidden`
- **Response:**
  ```json
  {
    "message": "Token tidak valid atau sudah kadaluarsa."
  }
  ```

**Skenario C: Akses Dengan Token Valid**
- **Request:** `GET /api/products`
- **Headers:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5c...`
- **Status Code:** `200 OK`
- **Response:**
  ```json
  [
    {
      "product_id": 1,
      "sku": "ELC-SCN-001",
      "product_name": "Barcode Scanner Zebra DS2208",
      ...
    }
  ]
  ```

---

## 3. Pengujian Validasi Frontend (Vue Router & Axios)

**1. Axios Interceptor:**
- Setiap kali frontend memanggil `api.get('/products')` (atau endpoint lainnya), *Axios Interceptor* secara otomatis mengambil `auth_token` dari `localStorage` dan menyisipkannya ke `Headers: { Authorization: 'Bearer <token>' }`.
- Ini memastikan pengguna tidak perlu login berulang kali selama sesi token masih aktif.

**2. Route Guarding (Proteksi Halaman):**
- Jika pengguna mencoba mengakses `/` (Dashboard) atau `/products` tanpa token di `localStorage`, router Vue akan langsung mencegat dan mengarahkan pengguna ke rute `/login`.
- Jika pengguna sudah login (memiliki token) dan mencoba mengakses halaman `/login`, router akan mengembalikan pengguna ke halaman utama (`/`).

**3. Tampilan Dinamis:**
- Saat berada di halaman Login, navigasi *Sidebar* dan *Topbar* disembunyikan.
- Saat berhasil masuk, Topbar akan menampilkan nama profil dan role pengguna (misal: "Dimas Prakoso - Admin") berdasarkan data dari payload login.
- Terdapat tombol *Logout* yang berfungsi menghapus sesi lokal (`localStorage`) dan membuang pengguna kembali ke `/login`.

---
*Pengujian ini membuktikan bahwa keamanan API sudah berjalan sesuai standar JWT dan halaman frontend berhasil disinkronisasi dengan autentikasi.*
