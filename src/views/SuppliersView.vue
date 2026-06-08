<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../services/api';
import { Truck, Eye, Search, AlertCircle } from 'lucide-vue-next';

const suppliers = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');

const fetchSuppliers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/suppliers');
    suppliers.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Gagal memuat data supplier.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSuppliers();
});

import { computed } from 'vue';
const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value;
  const q = searchQuery.value.toLowerCase();
  return suppliers.value.filter(
    (s) => 
      s.supplier_name.toLowerCase().includes(q) || 
      (s.contact_name && s.contact_name.toLowerCase().includes(q))
  );
});
</script>

<template>
  <div class="row g-4">
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-bottom p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
              <Truck :size="24" />
            </div>
            <div>
              <h2 class="h5 mb-1 fw-bold text-dark">Daftar Supplier</h2>
              <p class="text-muted mb-0 small">Kelola informasi penyuplai barang gudang Anda.</p>
            </div>
          </div>
          <div class="d-flex gap-2">
            <div class="position-relative">
              <input v-model="searchQuery" type="text" class="form-control form-control-sm ps-5 py-2 rounded-pill" placeholder="Cari supplier..." style="min-width: 200px;">
              <Search :size="16" class="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
            </div>
          </div>
        </div>
        
        <div class="card-body p-0">
          <div v-if="error" class="alert alert-danger m-4 d-flex align-items-center gap-2 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
            <AlertCircle :size="18" /> {{ error }}
          </div>
          
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4 text-secondary fw-semibold py-3" style="width: 5%;">ID</th>
                  <th class="text-secondary fw-semibold py-3">Nama Supplier</th>
                  <th class="text-secondary fw-semibold py-3">Kontak</th>
                  <th class="text-secondary fw-semibold py-3">Telepon</th>
                  <th class="text-end pe-4 text-secondary fw-semibold py-3" style="width: 100px;">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center text-muted py-5">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Memuat data...
                  </td>
                </tr>
                <tr v-else-if="filteredSuppliers.length === 0">
                  <td colspan="5" class="text-center text-muted py-5">Belum ada supplier yang ditemukan.</td>
                </tr>
                <tr v-for="(supplier, index) in filteredSuppliers" :key="supplier.supplier_id" style="transition: all 0.2s;">
                  <td class="ps-4 text-muted fw-medium">#{{ supplier.supplier_id }}</td>
                  <td>
                    <div class="fw-bold text-dark">{{ supplier.supplier_name }}</div>
                    <div class="small text-muted">{{ supplier.email || '-' }}</div>
                  </td>
                  <td>{{ supplier.contact_name || '-' }}</td>
                  <td>{{ supplier.phone || '-' }}</td>
                  <td class="text-end pe-4">
                    <RouterLink :to="'/suppliers/' + supplier.supplier_id" class="btn btn-sm btn-light text-primary rounded-circle p-2 action-btn" title="Lihat Detail">
                      <Eye :size="16" />
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-btn {
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.action-btn:hover {
  background-color: var(--bs-primary) !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
