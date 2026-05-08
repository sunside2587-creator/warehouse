CREATE DATABASE IF NOT EXISTS warehouse_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE warehouse_inventory;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock_transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE categories (
  category_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE suppliers (
  supplier_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_name VARCHAR(150) NOT NULL,
  contact_name VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(120) UNIQUE,
  address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'staff',
  email VARCHAR(120) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE products (
  product_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  sku VARCHAR(50) NOT NULL UNIQUE,
  product_name VARCHAR(150) NOT NULL,
  description TEXT,
  unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  reorder_level INT UNSIGNED NOT NULL DEFAULT 10,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE stock_transactions (
  transaction_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  transaction_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  CONSTRAINT fk_transactions_product
    FOREIGN KEY (product_id) REFERENCES products(product_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO categories (category_name, description) VALUES
  ('Elektronik', 'Perangkat elektronik untuk operasional gudang dan kantor.'),
  ('Alat Tulis', 'ATK dan perlengkapan administrasi harian.'),
  ('Peralatan Gudang', 'Alat bantu handling, packing, dan penyimpanan.'),
  ('Kebersihan', 'Produk kebersihan area kerja dan gudang.'),
  ('Keamanan', 'Peralatan keselamatan dan keamanan kerja.'),
  ('Sparepart', 'Komponen pengganti mesin dan alat operasional.'),
  ('Kemasan', 'Material pembungkus dan pengiriman barang.'),
  ('Furniture', 'Perabot pendukung kantor dan gudang.'),
  ('Makanan Minuman', 'Konsumsi untuk pantry dan tim operasional.'),
  ('Bahan Baku', 'Material produksi utama yang disimpan di gudang.');

INSERT INTO suppliers (supplier_name, contact_name, phone, email, address) VALUES
  ('PT Sumber Elektronik Jaya', 'Budi Hartono', '021-555-0101', 'sales@sumberelektronik.co.id', 'Jl. Industri Raya No. 12, Jakarta'),
  ('CV Mitra ATK Nusantara', 'Rina Maheswari', '022-555-0102', 'order@mitraatk.co.id', 'Jl. Merdeka No. 45, Bandung'),
  ('PT Logistik Perkasa', 'Andi Pratama', '031-555-0103', 'procurement@logistikperkasa.co.id', 'Jl. Pergudangan Timur No. 8, Surabaya'),
  ('UD Bersih Sentosa', 'Siti Aminah', '0274-555-0104', 'admin@bersihsentosa.co.id', 'Jl. Kaliurang Km 6, Yogyakarta'),
  ('PT Safety Prima', 'Dewi Lestari', '024-555-0105', 'sales@safetyprima.co.id', 'Jl. Pemuda No. 77, Semarang'),
  ('CV Teknik Mandiri', 'Fajar Nugroho', '061-555-0106', 'support@teknikmandiri.co.id', 'Jl. Gatot Subroto No. 21, Medan'),
  ('PT Kemasan Indo Pack', 'Yusuf Hidayat', '021-555-0107', 'cs@indopack.co.id', 'Jl. Raya Bekasi No. 19, Bekasi'),
  ('CV Furni Karya', 'Maya Kartika', '0251-555-0108', 'hello@furnikarya.co.id', 'Jl. Pajajaran No. 30, Bogor'),
  ('PT Pantry Sejahtera', 'Nadia Putri', '021-555-0109', 'order@pantrysejahtera.co.id', 'Jl. Kebon Jeruk No. 5, Jakarta'),
  ('PT Bahan Prima Global', 'Rangga Saputra', '021-555-0110', 'supply@bahanprima.co.id', 'Kawasan Industri MM2100, Cikarang');

INSERT INTO users (username, password_hash, full_name, role, email) VALUES
  ('admin_gudang', '$2b$10$dummyhashadmin001', 'Dimas Prakoso', 'admin', 'dimas.prakoso@warehouse.local'),
  ('staff_inbound', '$2b$10$dummyhashstaff002', 'Aulia Rahma', 'staff', 'aulia.rahma@warehouse.local'),
  ('staff_outbound', '$2b$10$dummyhashstaff003', 'Rizky Maulana', 'staff', 'rizky.maulana@warehouse.local'),
  ('supervisor', '$2b$10$dummyhashadmin004', 'Mei Santoso', 'admin', 'mei.santoso@warehouse.local'),
  ('viewer_finance', '$2b$10$dummyhashviewer005', 'Naufal Akbar', 'viewer', 'naufal.akbar@warehouse.local'),
  ('staff_quality', '$2b$10$dummyhashstaff006', 'Clara Wijaya', 'staff', 'clara.wijaya@warehouse.local'),
  ('staff_packing', '$2b$10$dummyhashstaff007', 'Bagas Wibowo', 'staff', 'bagas.wibowo@warehouse.local'),
  ('staff_inventory', '$2b$10$dummyhashstaff008', 'Tari Anggraini', 'staff', 'tari.anggraini@warehouse.local'),
  ('viewer_audit', '$2b$10$dummyhashviewer009', 'Hendra Kurniawan', 'viewer', 'hendra.kurniawan@warehouse.local'),
  ('admin_system', '$2b$10$dummyhashadmin010', 'Laras Pertiwi', 'admin', 'laras.pertiwi@warehouse.local');

INSERT INTO products
  (category_id, supplier_id, sku, product_name, description, unit, stock_quantity, reorder_level, price)
VALUES
  (1, 1, 'ELC-SCN-001', 'Barcode Scanner Zebra DS2208', 'Scanner barcode 2D untuk meja penerimaan barang.', 'unit', 18, 5, 1850000.00),
  (2, 2, 'ATK-LBL-002', 'Label Sticker A6 Thermal', 'Label pengiriman ukuran A6 untuk printer thermal.', 'roll', 120, 30, 45000.00),
  (3, 3, 'WRH-PLT-003', 'Hand Pallet 2 Ton', 'Hand pallet untuk pemindahan barang berat.', 'unit', 6, 2, 3450000.00),
  (4, 4, 'CLN-DIS-004', 'Disinfectant Floor Cleaner 5L', 'Cairan pembersih lantai area gudang.', 'jerigen', 42, 15, 72000.00),
  (5, 5, 'SFT-HLM-005', 'Safety Helmet Kuning', 'Helm keselamatan standar proyek.', 'pcs', 75, 20, 58000.00),
  (6, 6, 'SPT-BLT-006', 'Bearing Conveyor 6204', 'Bearing pengganti untuk roller conveyor.', 'pcs', 34, 12, 38000.00),
  (7, 7, 'PKG-BOX-007', 'Kardus Packing 40x30x30', 'Kardus single wall untuk pengiriman reguler.', 'pcs', 980, 200, 6800.00),
  (8, 8, 'FUR-RCK-008', 'Rak Besi 5 Susun', 'Rak penyimpanan barang medium duty.', 'unit', 14, 4, 875000.00),
  (9, 9, 'FNB-WTR-009', 'Air Mineral 600ml', 'Air mineral untuk pantry dan kurir.', 'dus', 28, 10, 43000.00),
  (10, 10, 'RAW-PLS-010', 'Resin Plastik PP', 'Bahan baku plastik polypropylene.', 'kg', 1500, 300, 18500.00);

INSERT INTO stock_transactions
  (product_id, user_id, transaction_type, quantity, transaction_date, notes)
VALUES
  (1, 2, 'IN', 5, '2026-05-01 08:30:00', 'Pembelian scanner tambahan.'),
  (2, 7, 'OUT', 20, '2026-05-01 10:15:00', 'Dipakai untuk packing outbound.'),
  (3, 3, 'ADJUSTMENT', 1, '2026-05-02 09:00:00', 'Koreksi stok setelah opname.'),
  (4, 6, 'OUT', 6, '2026-05-02 13:20:00', 'Distribusi ke area cleaning.'),
  (5, 8, 'IN', 25, '2026-05-03 11:10:00', 'Restock APD gudang.'),
  (6, 6, 'OUT', 4, '2026-05-03 15:45:00', 'Penggantian sparepart conveyor.'),
  (7, 7, 'OUT', 150, '2026-05-04 09:25:00', 'Kebutuhan packing harian.'),
  (8, 2, 'IN', 3, '2026-05-04 14:05:00', 'Tambahan rak zona B.'),
  (9, 5, 'IN', 12, '2026-05-05 08:50:00', 'Restock pantry mingguan.'),
  (10, 8, 'OUT', 250, '2026-05-05 16:30:00', 'Pengeluaran bahan baku produksi.');

-- Contoh operasi CRUD.
-- Query di bawah ini sengaja dikomentari agar tidak mengubah dummy data saat file di-import.

-- INSERT: menambah barang baru.
-- INSERT INTO products
--   (category_id, supplier_id, sku, product_name, description, unit, stock_quantity, reorder_level, price)
-- VALUES
--   (7, 7, 'PKG-TPE-011', 'Lakban Bening 48mm', 'Lakban bening untuk packing reguler.', 'roll', 250, 60, 14500.00);

-- UPDATE: mengubah stok barang.
-- UPDATE products
-- SET stock_quantity = stock_quantity + 50
-- WHERE product_id = 2;

-- DELETE: menghapus transaksi yang salah.
-- DELETE FROM stock_transactions
-- WHERE transaction_id = 10;

-- SELECT: menampilkan nama produk beserta nama kategorinya.
-- SELECT
--   p.product_id,
--   p.sku,
--   p.product_name,
--   c.category_name,
--   p.stock_quantity,
--   p.unit
-- FROM products p
-- JOIN categories c ON c.category_id = p.category_id
-- ORDER BY p.product_name;
