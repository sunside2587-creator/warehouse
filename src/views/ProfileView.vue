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
  <div class="profile-container">
    <section class="page-heading mb-4">
      <p class="text-uppercase text-primary small fw-bold mb-1 tracking-wider">Akun Saya</p>
      <h1 class="h3 mb-2 fw-bold text-dark">Profil Pengguna</h1>
      <p class="text-muted mb-0">Kelola informasi akun dan keamanan password Anda dengan aman.</p>
    </section>

    <div class="row g-4">
      <!-- Profile Card -->
      <div class="col-12 col-md-5 col-xl-4">
        <div class="card profile-card border-0 shadow-sm rounded-4 overflow-hidden h-100">
          <div class="profile-header bg-gradient-primary"></div>
          <div class="card-body p-4 text-center position-relative">
            <div class="avatar-wrapper mx-auto bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center mb-3">
              <div class="avatar-inner bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center">
                <UserCircle2 :size="50" stroke-width="1.5" />
              </div>
            </div>
            
            <h2 class="h4 fw-bold mb-1 text-dark">{{ currentUser?.full_name || 'Loading...' }}</h2>
            <p class="text-muted mb-3 fw-medium">@{{ currentUser?.username || '...' }}</p>
            
            <span class="badge rounded-pill bg-primary px-4 py-2 mb-4 fw-medium text-capitalize shadow-sm">
              Role: {{ currentUser?.role || '...' }}
            </span>

            <div class="info-list text-start mt-2">
              <div class="info-item p-3 mb-2 rounded-3 bg-light d-flex align-items-center justify-content-between">
                <div>
                  <p class="small text-muted mb-0 text-uppercase fw-bold tracking-wider" style="font-size: 0.75rem;">User ID</p>
                  <p class="fw-bold mb-0 text-dark">#{{ currentUser?.user_id || '...' }}</p>
                </div>
                <div class="icon-box text-muted opacity-50"><UserCircle2 :size="20"/></div>
              </div>
              <div class="info-item p-3 rounded-3 bg-light d-flex align-items-center justify-content-between">
                <div>
                  <p class="small text-muted mb-0 text-uppercase fw-bold tracking-wider" style="font-size: 0.75rem;">Akses Sistem</p>
                  <p class="fw-bold mb-0 text-dark text-capitalize">{{ currentUser?.role || '...' }} Access</p>
                </div>
                <div class="icon-box text-muted opacity-50"><KeyRound :size="20"/></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Card -->
      <div class="col-12 col-md-7 col-xl-8">
        <div class="card security-card border-0 shadow-sm rounded-4 h-100">
          <div class="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-shape bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 45px; height: 45px;">
                <KeyRound :size="22" stroke-width="2" />
              </div>
              <div>
                <h3 class="h5 mb-1 fw-bold text-dark">Keamanan Akun</h3>
                <p class="text-muted small mb-0">Perbarui password Anda secara berkala untuk menjaga keamanan akun.</p>
              </div>
            </div>
          </div>
          
          <div class="card-body p-4">
            <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mb-4 border-0 bg-danger bg-opacity-10 text-danger rounded-3" role="alert">
              <AlertCircle class="flex-shrink-0" :size="20" />
              <small class="fw-medium">{{ error }}</small>
            </div>
            
            <div v-if="success" class="alert alert-success d-flex align-items-center gap-2 mb-4 border-0 bg-success bg-opacity-10 text-success rounded-3" role="alert">
              <CheckCircle2 class="flex-shrink-0" :size="20" />
              <small class="fw-medium">{{ success }}</small>
            </div>

            <form @submit.prevent="handleChangePassword" class="password-form mt-2">
              <div class="form-floating mb-4">
                <input 
                  type="password" 
                  class="form-control fw-medium" 
                  id="old_password" 
                  v-model="form.old_password"
                  placeholder="Password Saat Ini"
                  required
                  :disabled="loading"
                />
                <label for="old_password" class="text-muted">Password Saat Ini</label>
              </div>
              
              <div class="row g-3 mb-4">
                <div class="col-12 col-xl-6">
                  <div class="form-floating">
                    <input 
                      type="password" 
                      class="form-control fw-medium" 
                      id="new_password" 
                      v-model="form.new_password"
                      placeholder="Password Baru"
                      required
                      minlength="6"
                      :disabled="loading"
                    />
                    <label for="new_password" class="text-muted">Password Baru</label>
                  </div>
                </div>
                <div class="col-12 col-xl-6">
                  <div class="form-floating">
                    <input 
                      type="password" 
                      class="form-control fw-medium" 
                      id="confirm_password" 
                      v-model="form.confirm_password"
                      placeholder="Konfirmasi Password Baru"
                      required
                      minlength="6"
                      :disabled="loading"
                    />
                    <label for="confirm_password" class="text-muted">Konfirmasi Password Baru</label>
                  </div>
                </div>
              </div>

              <hr class="border-light my-4">

              <div class="d-flex justify-content-end">
                <button 
                  type="submit" 
                  class="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 rounded-3 fw-bold save-btn"
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
  </div>
</template>

<style scoped>
.tracking-wider {
  letter-spacing: 0.05em;
}

.profile-card, .security-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-card:hover, .security-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05) !important;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  height: 120px;
  width: 100%;
}

.avatar-wrapper {
  width: 110px;
  height: 110px;
  margin-top: -65px;
  padding: 5px;
  position: relative;
  z-index: 2;
}

.avatar-inner {
  width: 100%;
  height: 100%;
}

.info-item {
  border: 1px solid rgba(0,0,0,0.03);
  transition: background-color 0.2s ease;
}

.info-item:hover {
  background-color: #f1f5f9 !important;
}

.password-form .form-floating .form-control {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.password-form .form-floating .form-control:focus {
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.password-form .form-floating label {
  padding-left: 1rem;
}

.save-btn {
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -6px rgba(37, 99, 235, 0.6);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fa-spin {
  animation: spin 1s linear infinite;
}
</style>
