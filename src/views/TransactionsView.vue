<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { AlertCircle, RefreshCw, Save, Search, Trash2 } from 'lucide-vue-next';
import { api, getErrorMessage } from '../services/api';

const loading = ref(true);
const saving = ref(false);
const deletingId = ref(null);
const error = ref('');
const success = ref('');
const products = ref([]);
const users = ref([]);
const transactions = ref([]);
const searchQuery = ref('');

const filteredTransactions = computed(() => {
  if (!searchQuery.value.trim()) return transactions.value;
  const q = searchQuery.value.toLowerCase();
  return transactions.value.filter(
    (t) =>
      t.product_name.toLowerCase().includes(q) ||
      (t.sku && t.sku.toLowerCase().includes(q)) ||
      (t.full_name && t.full_name.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q)),
  );
});

// Group transactions by date (YYYY-MM-DD)
const groupedTransactions = computed(() => {
  const groups = {};
  filteredTransactions.value.forEach((t) => {
    const date = new Date(t.transaction_date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(t);
  });
  
  // Sort dates descending
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      displayDate: new Date(date).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      transactions: groups[date]
    }));
});

const activeSection = ref('');
const observer = ref(null);

function setupScrollspy() {
  if (observer.value) observer.value.disconnect();

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id;
      }
    });
  }, {
    root: document.querySelector('.scrollable-container'),
    threshold: 0,
    rootMargin: '-5% 0px -90% 0px'
  });

  const sections = document.querySelectorAll('.transaction-group');
  sections.forEach((section) => observer.value.observe(section));
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    activeSection.value = id;
  }
}

const formatter = new Intl.NumberFormat('id-ID');

const form = reactive({
  product_id: '',
  transaction_type: 'IN',
  quantity: 1,
  user_id: '',
  notes: '',
});

function resetForm() {
  form.product_id = products.value[0]?.product_id || '';
  form.transaction_type = 'IN';
  form.quantity = 1;
  form.user_id = users.value[0]?.user_id || '';
  form.notes = '';
}

function typeLabel(type) {
  return {
    IN: 'Masuk',
    OUT: 'Keluar',
    ADJUSTMENT: 'Penyesuaian',
  }[type] || type;
}

function typeClass(type) {
  return {
    IN: 'text-bg-success',
    OUT: 'text-bg-danger',
    ADJUSTMENT: 'text-bg-warning',
  }[type] || 'text-bg-secondary';
}

async function loadTransactions() {
  loading.value = true;
  error.value = '';

  try {
    const [productsResponse, usersResponse, transactionsResponse] = await Promise.all([
      api.get('/products'),
      api.get('/users'),
      api.get('/stock-transactions'),
    ]);

    products.value = productsResponse.data;
    users.value = usersResponse.data;
    transactions.value = transactionsResponse.data.map(t => ({
      ...t,
      // Resolve petugas full name, handling numeric/string ID differences
      full_name:
        t.user?.full_name ||
        usersResponse.data.find(u => Number(u.user_id) === Number(t.user_id))?.full_name ||
        '-',
    }));

    if (!form.product_id || !form.user_id) {
      resetForm();
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function saveTransaction() {
  saving.value = true;
  error.value = '';
  success.value = '';

  try {
    await api.patch(`/products/${form.product_id}/stock`, {
      transaction_type: form.transaction_type,
      quantity: Number(form.quantity),
      user_id: form.user_id ? Number(form.user_id) : null,
      notes: form.notes || null,
    });

    success.value = 'Transaksi stok berhasil disimpan.';
    await loadTransactions();
    resetForm();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    saving.value = false;
  }
}

async function deleteTransaction(transaction) {
  const confirmed = window.confirm(
    `Hapus transaksi #${transaction.transaction_id} untuk "${transaction.product_name}"? Stok produk akan disesuaikan kembali.`,
  );

  if (!confirmed) {
    return;
  }

  deletingId.value = transaction.transaction_id;
  error.value = '';
  success.value = '';

  try {
    await api.delete(`/stock-transactions/${transaction.transaction_id}`);
    success.value = 'Transaksi berhasil dihapus dan stok produk disesuaikan kembali.';
    await loadTransactions();
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    deletingId.value = null;
  }
}

// Re-setup scrollspy when grouped transactions change (e.g. search)
watch(groupedTransactions, () => {
  nextTick(setupScrollspy);
}, { deep: true });

onMounted(async () => {
  await loadTransactions();
  nextTick(setupScrollspy);
});
</script>

<template>
  <section class="page-heading d-flex flex-column flex-xl-row gap-3 justify-content-between">
    <div>
      <p class="text-uppercase text-muted small fw-semibold mb-1">Operasional</p>
      <h1 class="h3 mb-1">Transaksi Stok</h1>
      <p class="text-muted mb-0">Catat riwayat barang masuk (IN) dan keluar (OUT).</p>
    </div>
  </section>

  <div v-if="error" class="alert alert-warning d-flex align-items-start gap-2 mt-4" role="alert">
    <AlertCircle class="flex-shrink-0 mt-1" :size="20" aria-hidden="true" />
    <div>{{ error }}</div>
  </div>
  <div v-if="success" class="alert alert-success mt-4" role="status">{{ success }}</div>

  <div class="row g-4 mt-1">
    <div class="col-12 col-xl-4">
      <section class="data-panel">
        <div class="panel-header">
          <h2 class="h5 mb-0">Input Transaksi</h2>
        </div>
        <form class="p-3 p-lg-4" @submit.prevent="saveTransaction">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label" for="product_id">Produk</label>
              <select id="product_id" v-model="form.product_id" class="form-select" required>
                <option disabled value="">Pilih produk</option>
                <option v-for="product in products" :key="product.product_id" :value="product.product_id">
                  {{ product.product_name }} - stok {{ formatter.format(Number(product.stock_quantity)) }}
                </option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label" for="transaction_type">Tipe Transaksi</label>
              <select id="transaction_type" v-model="form.transaction_type" class="form-select" required>
                <option value="IN">Barang Masuk</option>
                <option value="OUT">Barang Keluar</option>
                <option value="ADJUSTMENT">Penyesuaian</option>
              </select>
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="quantity">Jumlah</label>
              <input id="quantity" v-model.number="form.quantity" class="form-control" min="1" type="number" required />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label" for="user_id">Petugas</label>
              <select id="user_id" v-model="form.user_id" class="form-select">
                <option value="">Tanpa user</option>
                <option v-for="user in users" :key="user.user_id" :value="user.user_id">
                  {{ user.full_name }}
                </option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label" for="notes">Catatan</label>
              <textarea id="notes" v-model.trim="form.notes" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <button class="btn btn-primary icon-btn w-100 mt-4" type="submit" :disabled="saving">
            <Save :size="18" aria-hidden="true" />
            <span>{{ saving ? 'Menyimpan...' : 'Simpan Transaksi' }}</span>
          </button>
        </form>
      </section>
    </div>

    <div class="col-12 col-xl-8">
      <section class="data-panel">
        <div class="panel-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <h2 class="h5 mb-0">Riwayat Transaksi</h2>
            <span class="badge text-bg-light">{{ filteredTransactions.length }} / {{ transactions.length }} item</span>
          </div>
          <div class="input-group search-box" style="max-width: 320px;">
            <span class="input-group-text bg-transparent border-end-0">
              <Search :size="18" class="text-muted" />
            </span>
            <input
              v-model="searchQuery"
              class="form-control border-start-0 ps-0"
              placeholder="Cari produk, SKU, atau petugas..."
              type="text"
            />
          </div>
        </div>

        <!-- Scrollspy Navigation -->
        <div v-if="groupedTransactions.length > 1" class="scrollspy-nav border-bottom px-3 py-2 bg-light sticky-top" style="top: 0; z-index: 10;">
          <div class="d-flex gap-2 overflow-auto pb-1" style="scrollbar-width: thin;">
            <button
              v-for="group in groupedTransactions"
              :key="'nav-' + group.date"
              class="btn btn-sm text-nowrap"
              :class="activeSection === 'group-' + group.date ? 'btn-primary' : 'btn-outline-secondary border-0'"
              @click="scrollToSection('group-' + group.date)"
            >
              {{ new Date(group.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}
            </button>
          </div>
        </div>

        <div :class="['table-responsive', { 'scrollable-container': filteredTransactions.length > 8 }]" style="max-height: 600px; position: relative;">
          <div v-if="loading" class="text-center text-muted py-5">
            <RefreshCw class="spinner mb-2" :size="24" />
            <p>Memuat transaksi...</p>
          </div>
          <div v-else-if="!transactions.length" class="text-center text-muted py-5">
            <p>Belum ada transaksi.</p>
          </div>
          <div v-else>
            <div v-for="group in groupedTransactions" :key="group.date" :id="'group-' + group.date" class="transaction-group">
              <div class="group-header sticky-top bg-light-subtle px-3 py-2 border-bottom border-top fw-bold text-muted small">
                {{ group.displayDate }}
              </div>
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small text-uppercase">
                    <th style="width: 70px;">ID</th>
                    <th>Produk</th>
                    <th style="width: 100px;">Tipe</th>
                    <th class="text-end" style="width: 60px;">Qty</th>
                    <th style="width: 150px;">Petugas</th>
                    <th style="width: 100px;">Tanggal</th>
                    <th class="text-end" style="width: 60px;">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in group.transactions" :key="transaction.transaction_id">
                    <td style="width: 70px;"><code>#{{ transaction.transaction_id }}</code></td>
                    <td>
                      <strong class="d-block text-truncate" style="max-width: 200px;" :title="transaction.product_name">
                        {{ transaction.product_name }}
                      </strong>
                      <small class="text-muted d-block text-truncate" style="max-width: 200px;">{{ transaction.sku }}</small>
                    </td>
                    <td style="width: 100px;">
                      <span :class="['badge', typeClass(transaction.transaction_type)]">
                        {{ typeLabel(transaction.transaction_type) }}
                      </span>
                    </td>
                    <td class="text-end" style="width: 60px;">{{ formatter.format(Number(transaction.quantity)) }}</td>
                    <td class="text-truncate" style="max-width: 150px;">{{ transaction.user?.full_name || transaction.full_name || '-' }}</td>
                    <td style="width: 100px;">{{ new Date(transaction.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</td>
                    <td class="text-end" style="width: 60px;">
                      <button
                        class="btn btn-sm btn-outline-danger icon-only"
                        type="button"
                        title="Hapus transaksi"
                        :disabled="deletingId === transaction.transaction_id"
                        @click="deleteTransaction(transaction)"
                      >
                        <Trash2 :size="16" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
