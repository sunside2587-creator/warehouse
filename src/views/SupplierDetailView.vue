<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';
import { ArrowLeft, User, Phone, Mail, MapPin, Building2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const supplier = ref(null);
const loading = ref(true);
const error = ref('');
const deleteError = ref('');
const isDeleting = ref(false);

const userStr = localStorage.getItem('auth_user');
const userRole = ref(userStr ? JSON.parse(userStr).role : 'viewer');

const fetchSupplierDetail = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get(`/suppliers/${route.params.id}`);
    supplier.value = response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Supplier tidak ditemukan.';
    } else {
      error.value = err.response?.data?.message || 'Gagal memuat detail supplier.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSupplierDetail();
});

const handleDelete = async () => {
  if (!confirm('Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }

  isDeleting.value = true;
  deleteError.value = '';

  try {
    await api.delete(`/suppliers/${route.params.id}`);
    alert('Supplier berhasil dihapus.');
    router.push('/suppliers');
  } catch (err) {
    deleteError.value = err.response?.data?.message || 'Terjadi kesalahan saat menghapus supplier.';
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="row g-4">
    <div class="col-12 col-md-8 mx-auto">
      
      <div class="d-flex align-items-center mb-3">
        <button @click="router.push('/suppliers')" class="btn btn-sm btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1">
          <ArrowLeft :size="16" /> Kembali ke Daftar Supplier
        </button>
      </div>

      <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
        <AlertCircle :size="18" /> {{ error }}
      </div>
      
      <div v-else-if="loading" class="text-center py-5 text-muted">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p>Memuat detail supplier...</p>
      </div>

      <div v-else-if="supplier" class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
              <Building2 :size="28" />
            </div>
            <div>
              <h2 class="h4 mb-0 fw-bold text-dark">{{ supplier.supplier_name }}</h2>
              <p class="text-muted mb-0 small">ID Supplier: #{{ supplier.supplier_id }}</p>
            </div>
          </div>
          <div v-if="userRole === 'admin'">
             <button @click="handleDelete" :disabled="isDeleting" class="btn btn-danger d-flex align-items-center gap-2 px-3 shadow-sm rounded-pill">
                <Trash2 :size="16" /> 
                <span v-if="isDeleting">Menghapus...</span>
                <span v-else>Hapus Supplier</span>
             </button>
          </div>
        </div>
        
        <div class="card-body p-4">
          <div v-if="deleteError" class="alert alert-warning d-flex align-items-start gap-2 mb-4 border-0 bg-warning bg-opacity-10 text-dark rounded-3" role="alert">
            <AlertTriangle :size="20" class="text-warning flex-shrink-0 mt-1" /> 
            <div>
              <strong>Gagal Menghapus!</strong>
              <p class="mb-0 mt-1">{{ deleteError }}</p>
            </div>
          </div>

          <h5 class="fw-bold mb-4 text-secondary text-uppercase" style="font-size: 0.85rem; letter-spacing: 1px;">Informasi Kontak</h5>
          
          <div class="row g-4">
            <div class="col-md-6">
              <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-4">
                <div class="text-secondary mt-1"><User :size="20" /></div>
                <div>
                  <small class="text-muted d-block mb-1">Nama Kontak</small>
                  <span class="fw-medium text-dark">{{ supplier.contact_name || 'Tidak ada data' }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-4">
                <div class="text-secondary mt-1"><Phone :size="20" /></div>
                <div>
                  <small class="text-muted d-block mb-1">Nomor Telepon</small>
                  <span class="fw-medium text-dark">{{ supplier.phone || 'Tidak ada data' }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-4">
                <div class="text-secondary mt-1"><Mail :size="20" /></div>
                <div>
                  <small class="text-muted d-block mb-1">Email</small>
                  <span class="fw-medium text-dark">{{ supplier.email || 'Tidak ada data' }}</span>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-4">
                <div class="text-secondary mt-1"><MapPin :size="20" /></div>
                <div>
                  <small class="text-muted d-block mb-1">Alamat</small>
                  <span class="fw-medium text-dark">{{ supplier.address || 'Tidak ada data' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-4 pt-3 border-top text-muted small">
            <p class="mb-0">Ditambahkan pada: {{ new Date(supplier.created_at).toLocaleString('id-ID') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
