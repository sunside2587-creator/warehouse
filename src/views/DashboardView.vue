<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { AlertCircle, Boxes, Database, RefreshCw, TrendingDown, Wallet } from 'lucide-vue-next';
import { api, getErrorMessage } from '../services/api';

const loading = ref(true);
const error = ref('');
const dashboard = ref({
  summary: {
    totalProducts: 0,
    totalStock: 0,
    inventoryValue: 0,
    lowStockProducts: 0,
  },
  recentTransactions: [],
});
const products = ref([]);

const formatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const lowStockProducts = computed(() =>
  products.value.filter((product) => Number(product.stock_quantity) <= Number(product.reorder_level)),
);

const groupedRecentTransactions = computed(() => {
  const groups = {};
  dashboard.value.recentTransactions?.forEach((t) => {
    // Gunakan local date (YYYY-MM-DD) agar tidak bergeser hari karena UTC
    const date = new Date(t.transaction_date).toLocaleDateString('en-CA');
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
  });
  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({
      date,
      displayDate: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
      transactions: groups[date]
    }));
});

const groupedLowStock = computed(() => {
  const groups = {};
  lowStockProducts.value.forEach((p) => {
    const cat = p.category_name || 'Lainnya';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  return Object.keys(groups).sort().map(name => ({
    name,
    products: groups[name]
  }));
});
const activeTransactionSection = ref('');
const activeStockSection = ref('');
const transactionObserver = ref(null);
const stockObserver = ref(null);

function setupScrollspy(type) {
  const isTransaction = type === 'transaction';
  const observer = isTransaction ? transactionObserver : stockObserver;
  const activeRef = isTransaction ? activeTransactionSection : activeStockSection;
  const containerClass = isTransaction ? '.transaction-scroll' : '.stock-scroll';
  const groupClass = isTransaction ? '.transaction-group-item' : '.stock-group-item';

  if (observer.value) observer.value.disconnect();

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeRef.value = entry.target.id;
      }
    });
  }, {
    root: document.querySelector(containerClass),
    threshold: 0,
    rootMargin: '-5% 0px -90% 0px'
  });

  const sections = document.querySelectorAll(groupClass);
  sections.forEach((section) => observer.value.observe(section));

  // Set initial active section if not set
  if (sections.length > 0 && !activeRef.value) {
    activeRef.value = sections[0].id;
  }
}

function scrollToSection(containerClass, id, activeRef) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    activeRef.value = id;
  }
}

const cards = computed(() => [
  {
    label: 'Total Produk',
    value: formatter.format(Number(dashboard.value.summary?.totalProducts || 0)),
    icon: Boxes,
    tone: 'primary',
  },
  {
    label: 'Total Stok',
    value: formatter.format(Number(dashboard.value.summary?.totalStock || 0)),
    icon: Database,
    tone: 'success',
  },
  {
    label: 'Nilai Inventaris',
    value: currencyFormatter.format(Number(dashboard.value.summary?.inventoryValue || 0)),
    icon: Wallet,
    tone: 'warning',
  },
  {
    label: 'Stok Menipis',
    value: formatter.format(Number(dashboard.value.summary?.lowStockProducts || 0)),
    icon: TrendingDown,
    tone: 'danger',
  },
]);

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

async function loadDashboard() {
  loading.value = true;
  error.value = '';

  try {
    const [dashboardResponse, productsResponse] = await Promise.all([
      api.get('/dashboard'),
      api.get('/products'),
    ]);
    dashboard.value = dashboardResponse.data;
    products.value = productsResponse.data;
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadDashboard();
  nextTick(() => {
    setupScrollspy('transaction');
    setupScrollspy('stock');
  });
});

watch([groupedRecentTransactions, groupedLowStock], () => {
  nextTick(() => {
    setupScrollspy('transaction');
    setupScrollspy('stock');
  });
}, { deep: true });
</script>

<template>
  <section class="page-heading d-flex flex-column flex-xl-row gap-3 justify-content-between">
    <div>
      <h1 class="h3 mb-1">Beranda Utama</h1>
      <p class="text-muted mb-0">Ringkasan performa inventaris, transaksi, dan peringatan stok.</p>
    </div>
  </section>

  <div v-if="error" class="alert alert-warning d-flex align-items-start gap-2 mt-4" role="alert">
    <AlertCircle class="flex-shrink-0 mt-1" :size="20" aria-hidden="true" />
    <div>
      <strong>Data belum bisa dimuat.</strong>
      <div>{{ error }}</div>
      <small>Pastikan MySQL aktif dan script <code>db/inventory.sql</code> sudah dijalankan.</small>
    </div>
  </div>

  <div class="row g-3 mt-1">
    <div v-for="card in cards" :key="card.label" class="col-12 col-sm-6 col-xl-3">
      <article class="metric-card h-100">
        <div class="d-flex align-items-center justify-content-between gap-3">
          <div>
            <p class="text-muted small mb-1">{{ card.label }}</p>
            <strong class="metric-value">{{ card.value }}</strong>
          </div>
          <span :class="['metric-icon', `metric-${card.tone}`]">
            <component :is="card.icon" :size="22" aria-hidden="true" />
          </span>
        </div>
      </article>
    </div>
  </div>

  <div class="row g-4 mt-1">
    <div class="col-12 col-xl-7">
      <section class="data-panel">
        <div class="panel-header">
          <h2 class="h5 mb-0">Transaksi Terakhir</h2>
        </div>
        
        <!-- Scrollspy Nav for Transactions -->
        <div class="scrollspy-nav border-bottom px-3 py-2 bg-light-subtle">
          <div class="d-flex gap-2 overflow-auto pb-1" style="scrollbar-width: none;">
            <button
              v-for="group in groupedRecentTransactions"
              :key="'nav-t-' + group.date"
              class="btn btn-sm text-nowrap py-1 px-3"
              :style="{ fontSize: '0.75rem' }"
              :class="activeTransactionSection === 'group-t-' + group.date ? 'btn-primary' : 'btn-outline-secondary border-0 text-muted'"
              @click="scrollToSection('.transaction-scroll', 'group-t-' + group.date, activeTransactionSection)"
            >
              {{ group.displayDate }}
            </button>
          </div>
        </div>

        <div class="scrollable-container transaction-scroll" style="height: 400px; position: relative;">
          <div v-if="loading" class="text-center text-muted py-5">
            <RefreshCw class="spinner mb-2" :size="24" />
            <p>Memuat transaksi...</p>
          </div>
          <div v-else-if="!dashboard.recentTransactions?.length" class="text-center text-muted py-5">
            <p>Belum ada transaksi.</p>
          </div>
          <div v-else>
            <div v-for="group in groupedRecentTransactions" :key="group.date" :id="'group-t-' + group.date" class="transaction-group transaction-group-item">
              <div class="group-header sticky-top bg-light-subtle px-3 py-1 border-bottom border-top fw-bold text-muted small">
                {{ group.displayDate }}
              </div>
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr class="text-muted small text-uppercase" style="font-size: 0.65rem;">
                    <th>Produk</th>
                    <th style="width: 80px;">Tipe</th>
                    <th class="text-end" style="width: 50px;">Qty</th>
                    <th class="text-end" style="width: 60px;">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in group.transactions" :key="transaction.transaction_id">
                    <td>
                      <strong class="d-block text-truncate" style="max-width: 150px;" :title="transaction.product_name">
                        {{ transaction.product_name }}
                      </strong>
                    </td>
                    <td>
                      <span :class="['badge', typeClass(transaction.transaction_type)]">
                        {{ typeLabel(transaction.transaction_type) }}
                      </span>
                    </td>
                    <td class="text-end">{{ formatter.format(Number(transaction.quantity)) }}</td>
                    <td class="small text-muted text-end">{{ new Date(transaction.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="col-12 col-xl-5">
      <section class="data-panel">
        <div class="panel-header">
          <h2 class="h5 mb-0">Produk Perlu Restock</h2>
        </div>

        <!-- Scrollspy Nav for Low Stock -->
        <div class="scrollspy-nav border-bottom px-3 py-2 bg-light-subtle">
          <div class="d-flex gap-2 overflow-auto pb-1" style="scrollbar-width: none;">
            <button
              v-for="group in groupedLowStock"
              :key="'nav-s-' + group.name"
              class="btn btn-sm text-nowrap py-1 px-3"
              :style="{ fontSize: '0.75rem' }"
              :class="activeStockSection === 'group-s-' + group.name ? 'btn-primary' : 'btn-outline-secondary border-0 text-muted'"
              @click="scrollToSection('.stock-scroll', 'group-s-' + group.name, activeStockSection)"
            >
              {{ group.name }}
            </button>
          </div>
        </div>

        <div class="scrollable-container stock-scroll" style="height: 400px; position: relative;">
          <div v-if="loading" class="text-center text-muted py-5">
            <RefreshCw class="spinner mb-2" :size="24" />
            <p>Memuat produk...</p>
          </div>
          <div v-else-if="!lowStockProducts.length" class="text-center text-muted py-5">
            <p>Semua stok aman.</p>
          </div>
          <div v-else>
            <div v-for="group in groupedLowStock" :key="group.name" :id="'group-s-' + group.name" class="transaction-group stock-group-item">
              <div class="group-header sticky-top bg-light-subtle px-3 py-1 border-bottom border-top fw-bold text-muted small">
                {{ group.name }}
              </div>
              <div class="list-group list-group-flush">
                <div
                  v-for="product in group.products"
                  :key="product.product_id"
                  class="list-group-item d-flex align-items-center justify-content-between gap-3 border-0 py-2"
                >
                  <div class="text-truncate">
                    <strong class="d-block text-truncate">{{ product.product_name }}</strong>
                    <small class="text-muted d-block text-truncate">{{ product.supplier_name }}</small>
                  </div>
                  <span class="badge text-bg-danger rounded-pill flex-shrink-0">
                    {{ formatter.format(Number(product.stock_quantity)) }} {{ product.unit }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
