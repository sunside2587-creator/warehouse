<script setup>
import { computed, onMounted, ref } from 'vue';
import { ShieldCheck, User, Users, Search, AlertCircle, RefreshCw } from 'lucide-vue-next';
import { api, getErrorMessage } from '../services/api';

const loading = ref(true);
const error = ref('');
const users = ref([]);
const searchQuery = ref('');

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value;
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
  );
});

async function loadUsers() {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get('/users');
    users.value = response.data;
  } catch (err) {
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

onMounted(loadUsers);
</script>

<template>
  <section class="page-heading d-flex flex-column flex-xl-row gap-3 justify-content-between">
    <div>
      <p class="text-uppercase text-muted small fw-semibold mb-1">Pengaturan Sistem</p>
      <h1 class="h3 mb-1">Daftar Pengguna</h1>
      <p class="text-muted mb-0">Kelola akses dan daftar akun yang terdaftar dalam sistem.</p>
    </div>
  </section>

  <div v-if="error" class="alert alert-warning d-flex align-items-start gap-2 mt-4" role="alert">
    <AlertCircle class="flex-shrink-0 mt-1" :size="20" aria-hidden="true" />
    <div>{{ error }}</div>
  </div>

  <div class="row g-4 mt-1">
    <div class="col-12">
      <section class="data-panel">
        <div class="panel-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
          <div class="d-flex align-items-center gap-2">
            <Users :size="20" class="text-primary" aria-hidden="true" />
            <h2 class="h5 mb-0">Semua Pengguna</h2>
            <span class="badge text-bg-light">{{ filteredUsers.length }} Akun</span>
          </div>
          
          <div class="d-flex gap-2 w-100" style="max-width: 400px;">
            <div class="input-group search-box flex-grow-1">
              <span class="input-group-text bg-transparent border-end-0">
                <Search :size="18" class="text-muted" />
              </span>
              <input
                v-model="searchQuery"
                class="form-control border-start-0 ps-0"
                placeholder="Cari nama, username, email..."
                type="text"
              />
            </div>
            <button class="btn btn-outline-secondary icon-only" @click="loadUsers" title="Refresh">
              <RefreshCw :size="18" :class="{'fa-spin': loading}" aria-hidden="true" />
            </button>
          </div>
        </div>
        
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Username</th>
                <th>Email</th>
                <th>Peran / Role</th>
                <th class="text-end">Terdaftar Pada</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center text-muted py-4">Memuat pengguna...</td>
              </tr>
              <tr v-else-if="!filteredUsers.length">
                <td colspan="5" class="text-center text-muted py-4">Tidak ada pengguna yang cocok dengan pencarian.</td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.user_id">
                <td>
                  <div class="d-flex align-items-center gap-3">
                    <div class="avatar-circle bg-light d-flex align-items-center justify-content-center rounded-circle" style="width: 40px; height: 40px;">
                      <User :size="20" class="text-secondary" />
                    </div>
                    <strong>{{ user.full_name }}</strong>
                  </div>
                </td>
                <td><code>@{{ user.username }}</code></td>
                <td><a :href="`mailto:${user.email}`" class="text-decoration-none">{{ user.email }}</a></td>
                <td>
                  <span :class="[
                    'badge rounded-pill',
                    user.role === 'admin' ? 'text-bg-primary' : 
                    user.role === 'staff' ? 'text-bg-success' : 'text-bg-secondary'
                  ]">
                    <ShieldCheck v-if="user.role === 'admin'" :size="12" class="me-1 mb-1" />
                    {{ user.role.toUpperCase() }}
                  </span>
                </td>
                <td class="text-end text-muted small">{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.avatar-circle {
  border: 1px solid var(--border-color);
}
</style>
