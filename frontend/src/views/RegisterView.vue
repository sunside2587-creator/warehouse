<template>
  <div class="register-container">
    <div class="register-wrapper">
      <div class="register-visual d-none d-md-flex flex-column justify-content-between p-5 text-white">
        <div class="position-relative z-1">
          <div class="brand-logo mb-4 d-flex align-items-center gap-2">
            <div class="logo-icon bg-white text-primary rounded-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
              <Boxes :size="28" />
            </div>
            <h1 class="h3 mb-0 fw-bold tracking-tight text-white">Warehouse<span class="opacity-75 ms-1 fw-light">System</span></h1>
          </div>
          <h2 class="display-5 fw-bold mb-4 text-white lh-sm">Join Our<br/>Platform</h2>
          <p class="lead opacity-75 pe-4">Create your account today and start managing your inventory with our powerful tools.</p>
        </div>
        
        <div class="testimonial position-relative z-1">
          <div class="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-3 rounded-4 backdrop-blur">
            <div class="avatar bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width:45px;height:45px;">N</div>
            <div>
              <p class="mb-0 fw-bold text-white">New Account</p>
              <p class="mb-0 small opacity-75">Viewer Access (Default)</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="register-form-area p-4 p-sm-5 d-flex align-items-center justify-content-center position-relative">
        <div class="w-100 position-relative z-1" style="max-width: 450px;">
          <div class="text-center mb-5 d-md-none">
            <div class="logo-icon bg-primary text-white rounded-3 d-inline-flex align-items-center justify-content-center mb-3 shadow" style="width: 56px; height: 56px;">
              <Boxes :size="32" />
            </div>
            <h2 class="h3 fw-bold text-dark">Warehouse System</h2>
            <p class="text-muted">Create your account</p>
          </div>

          <div class="mb-5 d-none d-md-block text-center text-md-start">
            <h3 class="h3 fw-bold mb-2 text-dark">Create Account</h3>
            <p class="text-muted">Fill in your details to register.</p>
          </div>
          
          <form @submit.prevent="handleRegister" class="auth-form">
            <div class="row g-3 mb-4">
              <div class="col-12">
                <div class="form-floating position-relative">
                  <input 
                    type="text" 
                    id="full_name" 
                    class="form-control"
                    v-model="form.full_name" 
                    placeholder="Full Name"
                    :disabled="isLoading"
                  />
                  <label for="full_name">Nama Lengkap</label>
                </div>
              </div>
              <div class="col-12">
                <div class="form-floating position-relative">
                  <input 
                    type="email" 
                    id="email" 
                    class="form-control"
                    v-model="form.email" 
                    placeholder="Email"
                    :disabled="isLoading"
                  />
                  <label for="email">Email</label>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="form-floating position-relative">
                  <input 
                    type="text" 
                    id="username" 
                    class="form-control"
                    v-model="form.username" 
                    placeholder="Username"
                    :disabled="isLoading"
                  />
                  <label for="username">Username</label>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="form-floating position-relative">
                  <input 
                    :type="showPassword ? 'text' : 'password'" 
                    id="password" 
                    class="form-control pe-5"
                    v-model="form.password" 
                    placeholder="Password"
                    :disabled="isLoading"
                  />
                  <label for="password">Password</label>
                  <button 
                    type="button" 
                    class="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted px-3"
                    @click="showPassword = !showPassword"
                    style="z-index: 5;"
                  >
                    <Eye v-if="!showPassword" :size="20" />
                    <EyeOff v-else :size="20" />
                  </button>
                </div>
              </div>
            </div>

            <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 px-3 border-0 bg-danger bg-opacity-10 text-danger rounded-3 fade show" role="alert">
               <AlertCircle :size="18" class="flex-shrink-0" />
               <small class="fw-medium">{{ error }}</small>
            </div>
            
            <div v-if="success" class="alert alert-success d-flex align-items-center gap-2 mb-4 py-2 px-3 border-0 bg-success bg-opacity-10 text-success rounded-3 fade show" role="alert">
               <CheckCircle2 :size="18" class="flex-shrink-0" />
               <small class="fw-medium">{{ success }}</small>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow login-btn text-white mb-4" :disabled="isLoading || success">
              <span v-if="isLoading" class="d-flex align-items-center justify-content-center gap-2">
                <RefreshCw class="fa-spin text-white" :size="18" />
                Mendaftarkan...
              </span>
              <span v-else class="text-white">Daftar Akun</span>
            </button>
            
            <p class="text-center text-muted">
              Sudah punya akun? 
              <RouterLink to="/login" class="text-primary text-decoration-none fw-semibold">Login di sini</RouterLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, getErrorMessage } from '../services/api';
import { Boxes, AlertCircle, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-vue-next';

const router = useRouter();

const form = reactive({
  full_name: '',
  email: '',
  username: '',
  password: ''
});

const showPassword = ref(false);
const error = ref('');
const success = ref('');
const isLoading = ref(false);

async function handleRegister() {
  try {
    error.value = '';
    success.value = '';
    
    if (!form.full_name || !form.email || !form.username || !form.password) {
      error.value = 'Semua kolom wajib diisi.';
      return;
    }
    
    if (form.password.length < 6) {
      error.value = 'Password minimal 6 karakter.';
      return;
    }

    isLoading.value = true;
    
    const response = await api.post('/register', form);
    
    success.value = response.data.message || 'Registrasi berhasil. Mengalihkan ke halaman login...';
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
    
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  /* Deep oceanic blue background */
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}

.register-wrapper {
  display: flex;
  width: 100%;
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
  min-height: 600px;
  margin: auto;
}

.register-visual {
  flex: 1.2;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  position: relative;
  overflow: hidden;
}

/* Abstract shapes inside the blue panel */
.register-visual::before {
  content: '';
  position: absolute;
  top: -15%;
  left: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
  border-radius: 50%;
  z-index: 0;
}

.register-visual::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -20%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, rgba(37, 99, 235, 0) 70%);
  border-radius: 50%;
  z-index: 0;
}

.register-form-area {
  flex: 1.5;
  background-color: #ffffff;
}

.backdrop-blur {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.auth-form .form-floating .form-control {
  border: 2px solid #e2e8f0;
  background-color: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: #0f172a;
  font-weight: 500;
}

.auth-form .form-floating .form-control:focus {
  border-color: #2563eb;
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.auth-form .form-floating label {
  color: #64748b;
  padding-left: 1rem;
}

.login-btn {
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  font-size: 1.1rem;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5) !important;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  background: #94a3b8;
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
