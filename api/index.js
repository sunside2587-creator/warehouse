import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000, // Tambahkan timeout 10 detik
  ssl: {
    rejectUnauthorized: false, // Ini penting untuk koneksi cloud database
  },
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function handleError(res, error) {
  console.error(error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: 'Data sudah ada. Gunakan nama, SKU, atau email lain.',
      detail: error.message,
    });
  }

  res.status(500).json({
    message: 'Terjadi kesalahan pada server atau koneksi database.',
    detail: error.message,
  });
}

const router = express.Router();

router.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      detail: error.message,
    });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const [summary] = await query(`
      SELECT
        COUNT(*) AS totalProducts,
        COALESCE(SUM(stock_quantity), 0) AS totalStock,
        COALESCE(SUM(stock_quantity * price), 0) AS inventoryValue,
        SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) AS lowStockProducts
      FROM products
    `);

    const recentTransactions = await query(`
      SELECT
        st.transaction_id,
        st.transaction_type,
        st.quantity,
        st.transaction_date,
        p.product_name,
        u.full_name
      FROM stock_transactions st
      JOIN products p ON p.product_id = st.product_id
      LEFT JOIN users u ON u.user_id = st.user_id
      ORDER BY st.transaction_date DESC
      LIMIT 25
    `);

    res.json({ summary, recentTransactions });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT category_id, category_name, description
      FROM categories
      ORDER BY category_name
    `);
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/categories', async (req, res) => {
  try {
    const categoryName = req.body.category_name?.trim();
    const description = req.body.description?.trim() || null;

    if (!categoryName) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi.' });
    }

    const result = await query(
      `
        INSERT INTO categories (category_name, description)
        VALUES (?, ?)
      `,
      [categoryName, description],
    );

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan.',
      category_id: result.insertId,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/suppliers', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT supplier_id, supplier_name, contact_name, phone, email, address
      FROM suppliers
      ORDER BY supplier_name
    `);
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplierName = req.body.supplier_name?.trim();
    const contactName = req.body.contact_name?.trim() || null;
    const phone = req.body.phone?.trim() || null;
    const email = req.body.email?.trim() || null;
    const address = req.body.address?.trim() || null;

    if (!supplierName) {
      return res.status(400).json({ message: 'Nama supplier wajib diisi.' });
    }

    const result = await query(
      `
        INSERT INTO suppliers (supplier_name, contact_name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
      `,
      [supplierName, contactName, phone, email, address],
    );

    res.status(201).json({
      message: 'Supplier berhasil ditambahkan.',
      supplier_id: result.insertId,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/users', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT user_id, username, full_name, role, email, created_at
      FROM users
      ORDER BY full_name
    `);
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/products', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        p.product_id,
        p.sku,
        p.product_name,
        p.stock_quantity,
        p.reorder_level,
        p.price,
        p.unit,
        p.created_at,
        c.category_id,
        c.category_name,
        s.supplier_id,
        s.supplier_name
      FROM products p
      JOIN categories c ON c.category_id = p.category_id
      JOIN suppliers s ON s.supplier_id = p.supplier_id
      ORDER BY p.product_name
    `);
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/stock-transactions', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        st.transaction_id,
        st.transaction_type,
        st.quantity,
        st.transaction_date,
        st.notes,
        p.product_id,
        p.sku,
        p.product_name,
        u.user_id,
        u.full_name
      FROM stock_transactions st
      JOIN products p ON p.product_id = st.product_id
      LEFT JOIN users u ON u.user_id = st.user_id
      ORDER BY st.transaction_date DESC, st.transaction_id DESC
      LIMIT 50
    `);
    res.json(rows);
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/products', async (req, res) => {
  try {
    const {
      sku,
      product_name,
      category_id,
      supplier_id,
      stock_quantity = 0,
      reorder_level = 10,
      price,
      unit = 'pcs',
    } = req.body;

    if (!sku || !product_name || !category_id || !supplier_id || price == null) {
      return res.status(400).json({ message: 'Data produk belum lengkap.' });
    }

    if (Number(stock_quantity) < 0 || Number(reorder_level) < 0 || Number(price) < 0) {
      return res.status(400).json({ message: 'Stok, reorder, dan harga tidak boleh negatif.' });
    }

    const result = await query(
      `
        INSERT INTO products
          (sku, product_name, category_id, supplier_id, stock_quantity, reorder_level, price, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [sku, product_name, category_id, supplier_id, stock_quantity, reorder_level, price, unit],
    );

    res.status(201).json({
      message: 'Produk berhasil ditambahkan.',
      product_id: result.insertId,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const stockQuantity = Number(req.body.stock_quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Produk tidak valid.' });
    }

    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      return res.status(400).json({ message: 'Stok harus berupa angka 0 atau lebih.' });
    }

    const result = await query(
      `
        UPDATE products
        SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `,
      [stockQuantity, productId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    res.json({ message: 'Stok produk berhasil diperbarui.' });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete('/products/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Produk tidak valid.' });
    }

    await connection.beginTransaction();

    await connection.execute('DELETE FROM stock_transactions WHERE product_id = ?', [productId]);

    const [result] = await connection.execute('DELETE FROM products WHERE product_id = ?', [productId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    await connection.commit();

    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (error) {
    await connection.rollback();
    handleError(res, error);
  } finally {
    connection.release();
  }
});

router.put('/products/:id/stock', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const productId = Number(req.params.id);
    const { quantity, transaction_type, user_id = null, notes = null } = req.body;
    const amount = Number(quantity);

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Produk dan jumlah transaksi tidak valid.' });
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(transaction_type)) {
      return res.status(400).json({ message: 'Data transaksi stok tidak valid.' });
    }

    await connection.beginTransaction();

    const stockChange = transaction_type === 'OUT' ? -Math.abs(amount) : amount;
    const [products] = await connection.execute(
      'SELECT stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
      [productId],
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    }

    const nextStock = Number(products[0].stock_quantity) + stockChange;

    if (nextStock < 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Stok tidak boleh menjadi negatif.' });
    }

    await connection.execute(
      'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
      [nextStock, productId],
    );

    const [transactionResult] = await connection.execute(
      `
        INSERT INTO stock_transactions
          (product_id, user_id, transaction_type, quantity, notes)
        VALUES (?, ?, ?, ?, ?)
      `,
      [productId, user_id, transaction_type, Math.abs(amount), notes],
    );

    await connection.commit();

    res.json({
      message: 'Stok berhasil diperbarui.',
      transaction_id: transactionResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    handleError(res, error);
  } finally {
    connection.release();
  }
});

router.delete('/stock-transactions/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
      return res.status(400).json({ message: 'Transaksi tidak valid.' });
    }

    await connection.beginTransaction();

    const [transactions] = await connection.execute(
      `
        SELECT product_id, transaction_type, quantity
        FROM stock_transactions
        WHERE transaction_id = ?
        FOR UPDATE
      `,
      [transactionId],
    );

    if (transactions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    const transaction = transactions[0];
    const [products] = await connection.execute(
      'SELECT stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
      [transaction.product_id],
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Produk transaksi tidak ditemukan.' });
    }

    const rollbackChange =
      transaction.transaction_type === 'OUT'
        ? Number(transaction.quantity)
        : -Number(transaction.quantity);
    const nextStock = Number(products[0].stock_quantity) + rollbackChange;

    if (nextStock < 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Transaksi tidak bisa dihapus karena rollback membuat stok negatif.',
      });
    }

    await connection.execute(
      'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
      [nextStock, transaction.product_id],
    );

    const [result] = await connection.execute(
      'DELETE FROM stock_transactions WHERE transaction_id = ?',
      [transactionId],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Transaksi tidak ditemukan.' });
    }

    await connection.commit();

    res.json({ message: 'Transaksi berhasil dihapus dan stok produk disesuaikan.' });
  } catch (error) {
    await connection.rollback();
    handleError(res, error);
  } finally {
    connection.release();
  }
});

app.use('/api', router);
app.use('/', router);

export default app;
