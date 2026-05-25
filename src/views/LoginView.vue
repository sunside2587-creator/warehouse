<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand">
        <h2>Warehouse</h2>
        <p>Inventory System</p>
      </div>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Masukkan username Anda"
            required
            :disabled="isLoading"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Masukkan password Anda"
            required
            :disabled="isLoading"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span v-if="isLoading">Memproses...</span>
          <span v-else>Masuk</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, getErrorMessage } from '../services/api';

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
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--bg-primary);
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
}

.login-card {
  background: var(--bg-surface);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
  border: 1px solid var(--border-color);
}

.brand {
  text-align: center;
  margin-bottom: 2rem;
}

.brand h2 {
  font-size: 2rem;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
}

.brand p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.2);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-login {
  width: 100%;
  padding: 0.8rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-login:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 6px;
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
