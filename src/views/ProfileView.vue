<script setup>
import { reactive, ref, onMounted } from 'vue';
import { KeyRound, CheckCircle2, AlertCircle, Save, RefreshCw, UserCircle2 } from 'lucide-vue-next';
import { api, getErrorMessage } from '../services/api';

const currentUser = ref(null);

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
});

const loading = ref(false);
const error = ref('');
const success = ref('');

onMounted(() => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
  }
});

async function handleChangePassword() {
  error.value = '';
  success.value = '';

  if (form.new_password !== form.confirm_password) {
    error.value = 'Password baru dan konfirmasi password tidak cocok.';
    return;
  }

  if (form.new_password.length < 6) {
    error.value = 'Password baru minimal 6 karakter.';
    return;
  }

  loading.value = true;
  try {
    const res = await api.patch('/profile/password', {
      old_password: form.old_password,
      new_password: form.new_password
    });
    
    success.value = res.data.message || 'Password berhasil diperbarui.';
    form.old_password = '';
    form.new_password = '';
    form.confirm_password = '';
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="page-heading mb-4">
    <p class="text-uppercase text-muted small fw-semibold mb-1">Akun Saya</p>
    <h1 class="h3 mb-1">Profil Pengguna</h1>
    <p class="text-muted mb-0">Kelola informasi akun dan keamanan password Anda.</p>
  </section>

  <div class="row g-4">
    <div class="col-12 col-md-5 col-xl-4">
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
        <div class="card-body p-4 p-xl-5 text-center d-flex flex-column align-items-center justify-content-center">
          <div class="avatar-lg bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mb-4" style="width: 100px; height: 100px;">
            <UserCircle2 :size="50" stroke-width="1.5" />
          </div>
          
          <h2 class="h4 fw-bold mb-1">{{ currentUser?.full_name || 'Loading...' }}</h2>
          <p class="text-muted mb-3">@{{ currentUser?.username || '...' }}</p>
          
          <span class="badge rounded-pill text-bg-primary px-3 py-2 mb-4 text-capitalize">
            Role: {{ currentUser?.role || '...' }}
          </span>

          <div class="text-start w-100 mt-2 bg-light rounded-3 p-3">
            <p class="small text-muted mb-1 text-uppercase fw-semibold tracking-wider">User ID</p>
            <p class="fw-medium mb-3">#{{ currentUser?.user_id || '...' }}</p>
            <p class="small text-muted mb-1 text-uppercase fw-semibold tracking-wider">Akses Sistem</p>
            <p class="fw-medium mb-0 text-capitalize">{{ currentUser?.role || '...' }} Access</p>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 col-md-7 col-xl-8">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
          <h3 class="h5 mb-0 d-flex align-items-center gap-2 text-dark">
            <KeyRound class="text-primary" :size="20" />
            Keamanan Akun
          </h3>
          <p class="text-muted small mt-1">Perbarui password Anda secara berkala untuk menjaga keamanan akun.</p>
        </div>
        
        <div class="card-body p-4">
          <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mb-4 border-0 bg-danger bg-opacity-10 text-danger" role="alert">
            <AlertCircle class="flex-shrink-0" :size="18" />
            <small class="fw-medium">{{ error }}</small>
          </div>
          
          <div v-if="success" class="alert alert-success d-flex align-items-center gap-2 mb-4 border-0 bg-success bg-opacity-10 text-success" role="alert">
            <CheckCircle2 class="flex-shrink-0" :size="18" />
            <small class="fw-medium">{{ success }}</small>
          </div>

          <form @submit.prevent="handleChangePassword">
            <div class="mb-4">
              <label for="old_password" class="form-label fw-medium text-dark">Password Saat Ini</label>
              <input 
                type="password" 
                class="form-control form-control-lg bg-light border-0" 
                id="old_password" 
                v-model="form.old_password"
                required
                :disabled="loading"
              />
            </div>
            
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-6">
                <label for="new_password" class="form-label fw-medium text-dark">Password Baru</label>
                <input 
                  type="password" 
                  class="form-control form-control-lg bg-light border-0" 
                  id="new_password" 
                  v-model="form.new_password"
                  required
                  minlength="6"
                  :disabled="loading"
                />
              </div>
              <div class="col-12 col-md-6">
                <label for="confirm_password" class="form-label fw-medium text-dark">Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  class="form-control form-control-lg bg-light border-0" 
                  id="confirm_password" 
                  v-model="form.confirm_password"
                  required
                  minlength="6"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="d-flex justify-content-end pt-2">
              <button 
                type="submit" 
                class="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 rounded-3 shadow-sm"
                :disabled="loading"
              >
                <RefreshCw v-if="loading" class="fa-spin" :size="18" />
                <Save v-else :size="18" />
                {{ loading ? 'Menyimpan...' : 'Simpan Password Baru' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-control-lg {
  font-size: 1rem;
  padding: 0.75rem 1rem;
}
.form-control:focus {
  box-shadow: 0 0 0 0.25rem rgba(37, 99, 235, 0.1);
  background-color: #fff !important;
  border: 1px solid #2563eb !important;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fa-spin {
  animation: spin 1s linear infinite;
}
</style>
