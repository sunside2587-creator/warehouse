# Sistem Manajemen Inventaris Gudang

Project ini memakai Vue.js + Vue Router + Axios + Bootstrap untuk frontend dan Node.js + Express sebagai backend bridge ke MySQL.

## Instalasi

```bash
npm install
```

## Database

1. Buat database MySQL:

```sql
CREATE DATABASE warehouse_inventory;
USE warehouse_inventory;
```

2. Jalankan script SQL di `db/inventory.sql`.
3. Salin `.env.example` menjadi `.env`, lalu sesuaikan kredensial MySQL.

## Menjalankan Project

```bash
npm run dev
```

Frontend: `http://127.0.0.1:5173`

Backend API: `http://127.0.0.1:3001/api/health`

## Fitur

- Dashboard ringkas inventaris
- Daftar produk dengan kategori dan supplier memakai relasi MySQL
- Form tambah barang
- Form transaksi stok masuk, stok keluar, dan penyesuaian
- API Express untuk categories, suppliers, products, users, dan stock transactions
- Script SQL berisi 5 tabel, 10 dummy data per tabel, dan contoh query CRUD

## Struktur Relasi

```text
categories (1) ---- (N) products
suppliers  (1) ---- (N) products
products   (1) ---- (N) stock_transactions
users      (1) ---- (N) stock_transactions
```
