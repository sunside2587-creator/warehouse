<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AlertCircle,
  Boxes,
  DollarSign,
  PackagePlus,
  RefreshCw,
  Save,
  Search,
  Tags,
  Trash2,
  TrendingDown,
  Truck,
} from 'lucide-vue-next';
import { api, getErrorMessage } from '../services/api';

const loading = ref(true);
const saving = ref(false);
const savingCategory = ref(false);
const savingSupplier = ref(false);
const savingStockId = ref(null);
const deletingProductId = ref(null);
const error = ref('');
const success = ref('');
const products = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const searchQuery = ref('');
const stockDrafts = reactive({});

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value;
  const q = searchQuery.value.toLowerCase();
  return products.value.filter(
    (p) =>
      p.product_name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)),
  );
});

const formatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const productStats = computed(() => {
  const totalStock = products.value.reduce(
    (sum, product) => sum + Number(product.stock_quantity || 0),
    0,
  );
  const inventoryValue = products.value.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity || 0) * Number(product.price || 0),
    0,
  );
  const lowStock = products.value.filter(
    (product) => Number(product.stock_quantity) <= Number(product.reorder_level),
  ).length;

  return [
    {
      label: 'Total Produk',
      value: formatter.format(products.value.length),
      icon: Boxes,
      tone: 'sky',
    },
    {
      label: 'Total Stok',
      value: formatter.format(totalStock),
      icon: PackagePlus,
      tone: 'amber',
    },
    {
      label: 'Nilai Gudang',
      value: currencyFormatter.format(inventoryValue),
      icon: DollarSign,
      tone: 'violet',
    },
    {
      label: 'Stok Rendah',
      value: formatter.format(lowStock),
      icon: TrendingDown,
      tone: 'rose',
    },
  ];
});

const form = reactive({
  sku: '',
  product_name: '',
  category_id: '',
  supplier_id: '',
  stock_quantity: 1,
  reorder_level: 10,
  price: 0,
  unit: 'pcs',
});

const categoryForm = reactive({
  category_name: '',
  description: '',
});

const supplierForm = reactive({
  supplier_name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
});

function resetForm() {
  form.sku = '';
  form.product_name = '';
  form.category_id = categories.value[0]?.category_id || '';
  form.supplier_id = suppliers.value[0]?.supplier_id || '';
  form.stock_quantity = 1;
  form.reorder_level = 10;
  form.price = 0;
  form.unit = 'pcs';
}

function syncStockDrafts() {
  products.value.forEach((product) => {
    stockDrafts[product.product_id] = Number(product.stock_quantity);
  });
}

async function loadProducts() {
  loading.value = true;
  error.value = '';

  try {
    const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/suppliers'),
    ]);

    products.value = productsResponse.data;
    categories.value = categoriesResponse.data;
    suppliers.value = suppliersResponse.data;
    syncStockDrafts();

    if (!form.category_id || !form.supplier_id) {
      resetForm();
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function addCategory() {
  savingCategory.value = true;
  error.value = '';
  success.value = '';

  try {
    const response = await api.post('/categories', {
      category_name: categoryForm.category_name,
      description: categoryForm.description,
    });
    const categoriesResponse = await api.get('/categories');

    categories.value = categoriesResponse.data;
    form.category_id = response.data.category_id;
    categoryForm.category_name = '';
    categoryForm.description = '';
    success.value = 'Kategori baru berhasil ditambahkan dan dipilih.';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    savingCategory.value = false;
  }
}

async function addSupplier() {
  savingSupplier.value = true;
  error.value = '';
  success.value = '';

  try {
    const response = await api.post('/suppliers', {
      supplier_name: supplierForm.supplier_name,
      contact_name: supplierForm.contact_name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      address: supplierForm.address,
    });
    const suppliersResponse = await api.get('/suppliers');

    suppliers.value = suppliersResponse.data;
    form.supplier_id = response.data.supplier_id;
    supplierForm.supplier_name = '';
    supplierForm.contact_name = '';
    supplierForm.phone = '';
    supplierForm.email = '';
    supplierForm.address = '';
    success.value = 'Supplier baru berhasil ditambahkan dan dipilih.';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    savingSupplier.value = false;
  }
}

async function updateStock(product) {
  const nextStock = Number(stockDrafts[product.product_id]);

  if (!Number.isFinite(nextStock) || nextStock < 0) {
    error.value = 'Stok harus berupa angka 0 atau lebih.';
    return;
  }

  savingStockId.value = product.product_id;
  error.value = '';
  success.value = '';

  try {
    await api.patch(`/products/${product.product_id}`, {
      stock_quantity: nextStock,
    });
    success.value = `Stok ${product.product_name} berhasil diperbarui.`;
    await loadProducts();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    savingStockId.value = null;
  }
}

async function deleteProduct(product) {
  const confirmed = window.confirm(
    `Hapus produk "${product.product_name}"? Riwayat transaksi stok produk ini juga akan dihapus.`,
  );

  if (!confirmed) {
    return;
  }

  deletingProductId.value = product.product_id;
  error.value = '';
  success.value = '';

  try {
    await api.delete(`/products/${product.product_id}`);
    success.value = `Produk ${product.product_name} berhasil dihapus.`;
    await loadProducts();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    deletingProductId.value = null;
  }
}

async function addProduct() {
  saving.value = true;
  error.value = '';
  success.value = '';

  try {
    await api.post('/products', {
      ...form,
      category_id: Number(form.category_id),
      supplier_id: Number(form.supplier_id),
      stock_quantity: Number(form.stock_quantity),
      reorder_level: Number(form.reorder_level),
      price: Number(form.price),
    });

    success.value = 'Produk baru berhasil ditambahkan.';
    resetForm();
    await loadProducts();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

onMounted(loadProducts);
</script>

<template>
  <section class="page-heading d-flex flex-column flex-xl-row gap-3 justify-content-between">
    <div>
      <p class="text-uppercase text-muted small fw-semibold mb-1">Master Data</p>
      <h1 class="h3 mb-1">Produk Gudang</h1>
      <p class="text-muted mb-0">Kelola barang, kategori, supplier, stok awal, dan reorder level.</p>
    </div>
  </section>

  <div v-if="error" class="alert alert-warning d-flex align-items-start gap-2 mt-4" role="alert">
    <AlertCircle class="flex-shrink-0 mt-1" :size="20" aria-hidden="true" />
    <div>{{ error }}</div>
  </div>
  <div v-if="success" class="alert alert-success mt-4" role="status">{{ success }}</div>

  <div class="row g-3 dashboard-stats mt-1">
    <div v-for="stat in productStats" :key="stat.label" class="col-12 col-md-6 col-xxl-3">
      <article class="metric-card dashboard-card h-100">
        <div>
          <strong class="metric-value">{{ stat.value }}</strong>
          <p class="text-muted mb-0">{{ stat.label }}</p>
        </div>
        <span :class="['metric-icon', `metric-${stat.tone}`]">
          <component :is="stat.icon" :size="22" aria-hidden="true" />
        </span>
      </article>
    </div>
  </div>

  <div class="row g-4 mt-1">
    <div class="col-12 col-xl-4">
      <section class="data-panel">
        <div class="panel-header">
          <h2 class="h5 mb-0 d-flex align-items-center gap-2">
            <PackagePlus :size="20" aria-hidden="true" />
            Tambah Barang
          </h2>
        </div>
        <form class="p-3 p-lg-4" @submit.prevent="addProduct">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="sku">SKU</label>
              <input id="sku" v-model.trim="form.sku" class="form-control" type="text" required />
            </div>
            <div class="col-12">
              <label class="form-label" for="product_name">Nama Produk</label>
              <input id="product_name" v-model.trim="form.product_name" class="form-control" type="text" required />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="category_id">Kategori</label>
              <select id="category_id" v-model="form.category_id" class="form-select" required>
                <option disabled value="">Pilih kategori</option>
                <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
                  {{ category.category_name }}
                </option>
              </select>
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="supplier_id">Supplier</label>
              <select id="supplier_id" v-model="form.supplier_id" class="form-select" required>
                <option disabled value="">Pilih supplier</option>
                <option v-for="supplier in suppliers" :key="supplier.supplier_id" :value="supplier.supplier_id">
                  {{ supplier.supplier_name }}
                </option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label" for="stock_quantity">Stok Awal</label>
              <input
                id="stock_quantity"
                v-model.number="form.stock_quantity"
                class="form-control"
                min="1"
                type="number"
                required
              />
            </div>
            <div class="col-6">
              <label class="form-label" for="reorder_level">Reorder</label>
              <input id="reorder_level" v-model.number="form.reorder_level" class="form-control" min="0" type="number" />
            </div>
            <div class="col-6">
              <label class="form-label" for="price">Harga</label>
              <input id="price" v-model.number="form.price" class="form-control" min="0" step="100" type="number" required />
            </div>
            <div class="col-6">
              <label class="form-label" for="unit">Satuan</label>
              <input id="unit" v-model.trim="form.unit" class="form-control" type="text" required />
            </div>
          </div>
          <button class="btn btn-primary icon-btn w-100 mt-4" type="submit" :disabled="saving">
            <Save :size="18" aria-hidden="true" />
            <span>{{ saving ? 'Menyimpan...' : 'Simpan Produk' }}</span>
          </button>
        </form>
      </section>

      <section class="data-panel mt-4">
        <div class="panel-header">
          <h2 class="h5 mb-0">Input New Supplier</h2>
        </div>
        <div class="p-3 p-lg-4">
          <ul class="nav nav-pills master-tabs mb-3" role="tablist">
            <li class="nav-item flex-fill" role="presentation">
              <button
                id="category-tab"
                class="nav-link active w-100 icon-btn"
                type="button"
                data-bs-toggle="pill"
                data-bs-target="#category-pane"
                role="tab"
                aria-controls="category-pane"
                aria-selected="true"
              >
                <Tags :size="17" aria-hidden="true" />
                <span>Kategori</span>
              </button>
            </li>
            <li class="nav-item flex-fill" role="presentation">
              <button
                id="supplier-tab"
                class="nav-link w-100 icon-btn"
                type="button"
                data-bs-toggle="pill"
                data-bs-target="#supplier-pane"
                role="tab"
                aria-controls="supplier-pane"
                aria-selected="false"
              >
                <Truck :size="17" aria-hidden="true" />
                <span>Supplier</span>
              </button>
            </li>
          </ul>

          <div class="tab-content">
            <div
              id="category-pane"
              class="tab-pane fade show active"
              role="tabpanel"
              aria-labelledby="category-tab"
              tabindex="0"
            >
              <form class="row g-3" @submit.prevent="addCategory">
                <div class="col-12">
                  <label class="form-label" for="category_name">Nama Kategori</label>
                  <input
                    id="category_name"
                    v-model.trim="categoryForm.category_name"
                    class="form-control"
                    type="text"
                    required
                  />
                </div>
                <div class="col-12">
                  <label class="form-label" for="category_description">Deskripsi</label>
                  <textarea
                    id="category_description"
                    v-model.trim="categoryForm.description"
                    class="form-control"
                    rows="2"
                  ></textarea>
                </div>
                <div class="col-12">
                  <button class="btn btn-success icon-btn w-100" type="submit" :disabled="savingCategory">
                    <Save :size="18" aria-hidden="true" />
                    <span>{{ savingCategory ? 'Menyimpan...' : 'Simpan Kategori' }}</span>
                  </button>
                </div>
              </form>
            </div>

            <div
              id="supplier-pane"
              class="tab-pane fade"
              role="tabpanel"
              aria-labelledby="supplier-tab"
              tabindex="0"
            >
              <form class="row g-3" @submit.prevent="addSupplier">
                <div class="col-12">
                  <label class="form-label" for="supplier_name">Nama Supplier</label>
                  <input
                    id="supplier_name"
                    v-model.trim="supplierForm.supplier_name"
                    class="form-control"
                    type="text"
                    required
                  />
                </div>
                <div class="col-12">
                  <label class="form-label" for="contact_name">Kontak</label>
                  <input id="contact_name" v-model.trim="supplierForm.contact_name" class="form-control" type="text" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="phone">Telepon</label>
                  <input id="phone" v-model.trim="supplierForm.phone" class="form-control" type="text" />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="email">Email</label>
                  <input id="email" v-model.trim="supplierForm.email" class="form-control" type="email" />
                </div>
                <div class="col-12">
                  <label class="form-label" for="address">Alamat</label>
                  <textarea id="address" v-model.trim="supplierForm.address" class="form-control" rows="2"></textarea>
                </div>
                <div class="col-12">
                  <button class="btn btn-success icon-btn w-100" type="submit" :disabled="savingSupplier">
                    <Save :size="18" aria-hidden="true" />
                    <span>{{ savingSupplier ? 'Menyimpan...' : 'Simpan Supplier' }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="col-12 col-xl-8">
      <section class="data-panel">
        <div class="panel-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <h2 class="h5 mb-0">Daftar Produk</h2>
            <span class="badge text-bg-light">{{ filteredProducts.length }} / {{ products.length }} item</span>
          </div>
          <div class="input-group search-box" style="max-width: 320px;">
            <span class="input-group-text bg-transparent border-end-0">
              <Search :size="18" class="text-muted" />
            </span>
            <input
              v-model="searchQuery"
              class="form-control border-start-0 ps-0"
              placeholder="Cari produk, SKU, atau supplier..."
              type="text"
            />
          </div>
        </div>
        <div :class="['table-responsive', { 'scrollable-container': filteredProducts.length > 12 }]">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Supplier</th>
                <th class="text-end">Stok</th>
                <th class="text-end">Harga</th>
                <th class="text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center text-muted py-4">Memuat produk...</td>
              </tr>
              <tr v-else-if="!products.length">
                <td colspan="7" class="text-center text-muted py-4">Belum ada produk.</td>
              </tr>
              <tr v-for="product in filteredProducts" :key="product.product_id">
                <td><code>{{ product.sku }}</code></td>
                <td>
                  <strong class="d-block">{{ product.product_name }}</strong>
                  <small class="text-muted">Reorder: {{ formatter.format(Number(product.reorder_level)) }}</small>
                </td>
                <td>{{ product.category_name }}</td>
                <td>{{ product.supplier_name }}</td>
                <td class="text-end">
                  <div class="stock-editor ms-auto">
                    <input
                      v-model.number="stockDrafts[product.product_id]"
                      class="form-control form-control-sm text-end"
                      min="0"
                      type="number"
                      :aria-label="`Stok ${product.product_name}`"
                    />
                    <span
                      :class="[
                        'badge rounded-pill',
                        Number(stockDrafts[product.product_id]) <= Number(product.reorder_level)
                          ? 'text-bg-danger'
                          : 'text-bg-success',
                      ]"
                    >
                      {{ product.unit }}
                    </span>
                    <button
                      class="btn btn-sm btn-outline-primary icon-only"
                      type="button"
                      title="Simpan stok"
                      :disabled="
                        savingStockId === product.product_id ||
                        Number(stockDrafts[product.product_id]) === Number(product.stock_quantity)
                      "
                      @click="updateStock(product)"
                    >
                      <Save :size="15" aria-hidden="true" />
                    </button>
                  </div>
                </td>
                <td class="text-end">{{ currencyFormatter.format(Number(product.price)) }}</td>
                <td class="text-end">
                  <button
                    class="btn btn-sm btn-outline-danger icon-only"
                    type="button"
                    title="Hapus produk"
                    :disabled="deletingProductId === product.product_id"
                    @click="deleteProduct(product)"
                  >
                    <Trash2 :size="16" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
