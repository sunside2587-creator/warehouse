<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-visual d-none d-lg-flex flex-column justify-content-between p-5 text-white">
        <div>
          <div class="brand-logo mb-4 d-flex align-items-center gap-2">
            <Boxes :size="32" class="text-white" />
            <h1 class="h3 mb-0 fw-bold tracking-tight">Warehouse<span class="opacity-50 ms-2 fw-light">System</span></h1>
          </div>
          <h2 class="display-5 fw-bold mb-3">Modern Inventory<br/>Management</h2>
          <p class="lead opacity-75">Streamline your supply chain operations with our intuitive dashboard.</p>
        </div>
        
        <div class="testimonial">
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="avatar bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width:40px;height:40px;">W</div>
            <div>
              <p class="mb-0 fw-bold">Admin Portal</p>
              <p class="mb-0 small opacity-75">Secure Access Area</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="login-form-area p-4 p-sm-5 d-flex align-items-center justify-content-center">
        <div class="w-100" style="max-width: 400px;">
          <div class="text-center mb-5 d-lg-none">
            <Boxes :size="48" class="text-primary mb-3" />
            <h2 class="h3 fw-bold">Warehouse System</h2>
            <p class="text-muted">Sign in to your account</p>
          </div>

          <div class="mb-5 d-none d-lg-block">
            <h3 class="h4 fw-bold mb-2">Welcome back</h3>
            <p class="text-muted">Please enter your details to sign in.</p>
          </div>
          
          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="form-floating mb-4">
              <input 
                type="text" 
                id="username" 
                class="form-control"
                v-model="username" 
                placeholder="Username"
                required
                :disabled="isLoading"
              />
              <label for="username">Username</label>
            </div>
            
            <div class="form-floating mb-4 position-relative">
              <input 
                type="password" 
                id="password" 
                class="form-control"
                v-model="password" 
                placeholder="Password"
                required
                :disabled="isLoading"
              />
              <label for="password">Password</label>
            </div>

            <div v-if="error" class="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 px-3 border-0 bg-danger bg-opacity-10 text-danger rounded-3 fade show" role="alert">
               <AlertCircle :size="18" />
               <small class="fw-medium">{{ error }}</small>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm login-btn" :disabled="isLoading">
              <span v-if="isLoading" class="d-flex align-items-center justify-content-center gap-2">
                <RefreshCw class="fa-spin" :size="18" />
                Signing in...
              </span>
              <span v-else>Sign In</span>
            </button>
            
            <p class="text-center mt-4 text-muted small">
              Protected by JWT Authentication. Use your registered credentials to access the system.
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, getErrorMessage } from '../services/api';
import { Boxes, AlertCircle, RefreshCw } from 'lucide-vue-next';

const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

async function handleLogin() {
  try {
    error.value = '';
    isLoading.value = true;
    
    const response = await api.post('/login', {
      username: username.value,
      password: password.value
    });
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/');
    }
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  background-color: #f3f4f6; /* fallback */
  background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-wrapper {
  display: flex;
  width: 100%;
  max-width: 1100px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.5);
  min-height: 600px;
}

.login-visual {
  flex: 1;
  background: linear-gradient(135deg, var(--accent-primary) 0%, #2563eb 100%);
  position: relative;
  overflow: hidden;
}

/* Glassmorphism elements inside visual area */
.login-visual::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
}

.login-visual::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
}

.login-form-area {
  flex: 1.2;
  background-color: var(--bg-surface);
}

.auth-form .form-floating .form-control {
  border: 2px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #1f2937;
}

.auth-form .form-floating .form-control:focus {
  border-color: var(--accent-primary);
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(var(--accent-primary-rgb), 0.1);
}

.auth-form .form-floating label {
  color: #6b7280;
  padding-left: 1rem;
}

.login-btn {
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--accent-primary) 0%, #2563eb 100%);
  border: none;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25) !important;
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  background: #9ca3af;
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
