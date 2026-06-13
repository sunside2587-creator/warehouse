<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import {
  ArrowLeftRight,
  Bell,
  Boxes,
  CircleHelp,
  LayoutDashboard,
  Menu,
  PackageSearch,
  RefreshCw,
  Search,
  Settings,
  UserRound,
  Warehouse,
  AlertTriangle,
  LogOut,
  User,
  CheckCircle2,
  Truck
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { api } from './services/api';

const route = useRoute();
const router = useRouter();
const isSidebarOpen = ref(false);

const formatter = new Intl.NumberFormat('id-ID');

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
  { to: '/products', label: 'Produk', icon: PackageSearch, roles: ['admin', 'staff', 'viewer'] },
  { to: '/suppliers', label: 'Supplier', icon: Truck, roles: ['admin', 'staff', 'viewer'] },
  { to: '/transactions', label: 'Transaksi Stok', icon: ArrowLeftRight, roles: ['admin', 'staff', 'viewer'] },
  { to: '/users', label: 'Pengguna', icon: UserRound, roles: ['admin'] },
];

const pageTitle = computed(
  () =>
    ({
      dashboard: 'Dashboard',
      products: 'Produk Gudang',
      suppliers: 'Daftar Supplier',
      'supplier-detail': 'Detail Supplier',
      transactions: 'Transaksi Stok',
      login: 'Login',
    })[route.name] || 'Inventaris Gudang',
);

import { watch } from 'vue';

const currentUser = ref(null);

const checkUser = () => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      currentUser.value = JSON.parse(userStr);
    } catch (e) {
      currentUser.value = null;
    }
  } else {
    currentUser.value = null;
  }
};

// Check initially
checkUser();

// Update on route change (e.g., after login redirect)
watch(() => route.path, () => {
  checkUser();
});

const handleRefresh = () => {
  window.location.reload();
};

const handleLogout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  router.push('/login');
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// --- Low Stock Notification Logic ---
const lowStockItems = ref([]);
const showNotifDropdown = ref(false);

const fetchLowStock = async () => {
  if (!localStorage.getItem('auth_token')) return;
  try {
    const res = await api.get('/products');
    lowStockItems.value = res.data.filter(p => Number(p.stock_quantity) <= Number(p.reorder_level));
  } catch (err) {
    console.error('Failed to fetch low stock', err);
  }
};

onMounted(() => {
  fetchLowStock();
  document.addEventListener('click', closeDropdowns);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
});

// --- Dropdowns Logic ---
const showProfileDropdown = ref(false);

const toggleNotif = (e) => {
  e.stopPropagation();
  showNotifDropdown.value = !showNotifDropdown.value;
  showProfileDropdown.value = false;
};

const toggleProfile = (e) => {
  e.stopPropagation();
  showProfileDropdown.value = !showProfileDropdown.value;
  showNotifDropdown.value = false;
};

const closeDropdowns = () => {
  showNotifDropdown.value = false;
  showProfileDropdown.value = false;
};
</script>

<template>
  <template v-if="route.name === 'login'">
    <RouterView />
  </template>
  <div v-else class="app-shell">
    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="isSidebarOpen = false"></div>
    <aside :class="['app-sidebar', { 'sidebar-open': isSidebarOpen }]">
      <RouterLink class="sidebar-brand" to="/">
        <span class="brand-mark">
          <Boxes :size="25" aria-hidden="true" />
        </span>
        <span>
          <strong>WAREHOUSE</strong>
          <small>Inventory</small>
        </span>
      </RouterLink>

      <nav class="sidebar-nav" aria-label="Navigasi utama">
        <p class="sidebar-label">Menu Utama</p>
        <template v-for="item in navItems" :key="item.to">
          <RouterLink 
            v-if="!item.roles || (currentUser && item.roles.includes(currentUser.role))"
            class="sidebar-link" 
            :to="item.to"
          >
            <component :is="item.icon" :size="18" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </template>

        <p class="sidebar-label mt-4"></p>
        
      </nav>

      <div class="sidebar-footer">
        <strong>Sistem Inventaris</strong>
        <span>Warehouse Management</span>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-topbar">
        <div class="topbar-left">
          <div class="topbar-breadcrumb">
            <h2 class="breadcrumb-label">{{ pageTitle }}</h2>
          </div>
          <div class="topbar-divider"></div>
          <div class="status-indicator d-none d-md-flex">
            <span class="status-dot"></span>
            <span class="status-text">System Live</span>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="topbar-icon" type="button" title="Refresh" @click="handleRefresh">
            <RefreshCw :size="18" aria-hidden="true" />
          </button>
          
          <div class="position-relative">
            <button class="topbar-icon" type="button" title="Notifikasi" @click="toggleNotif">
              <Bell :size="19" aria-hidden="true" />
              <span v-if="lowStockItems.length > 0" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.65rem; margin-top: 6px; margin-left: -10px;">
                {{ lowStockItems.length }}
              </span>
            </button>
            
            <!-- Notif Dropdown -->
            <div v-if="showNotifDropdown" class="dropdown-menu dropdown-menu-end show shadow-sm border-0 mt-2" style="right: 0; min-width: 320px; position: absolute;" @click.stop>
              <div class="p-3 border-bottom d-flex align-items-center justify-content-between">
                <h6 class="mb-0 fw-bold">Notifikasi Peringatan</h6>
                <span class="badge bg-danger">{{ lowStockItems.length }} Stok Menipis</span>
              </div>
              <div class="overflow-auto" style="max-height: 300px;">
                <div v-if="lowStockItems.length === 0" class="p-4 text-center text-muted">
                  <CheckCircle2 :size="30" class="text-success mb-2 opacity-50" />
                  <p class="mb-0 small">Semua stok produk dalam kondisi aman.</p>
                </div>
                <div v-for="item in lowStockItems" :key="item.product_id" class="p-3 border-bottom dropdown-item-custom">
                  <div class="d-flex gap-3 align-items-start">
                    <div class="text-danger mt-1"><AlertTriangle :size="18" /></div>
                    <div>
                      <p class="mb-1 fw-bold text-wrap lh-sm" style="font-size: 0.9rem;">{{ item.product_name }}</p>
                      <p class="mb-0 text-muted small">Sisa stok: <strong class="text-danger">{{ formatter.format(Number(item.stock_quantity)) }} {{ item.unit }}</strong> (Batas: {{ formatter.format(Number(item.reorder_level)) }})</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-2 text-center border-top">
                <RouterLink to="/products" class="text-decoration-none small text-primary fw-medium" @click="closeDropdowns">Lihat Semua Produk</RouterLink>
              </div>
            </div>
          </div>

          <button class="topbar-icon d-xl-none" type="button" title="Menu" @click="toggleSidebar">
            <Menu :size="20" aria-hidden="true" />
          </button>

          <div class="topbar-divider d-none d-sm-block"></div>

          <div class="user-profile position-relative cursor-pointer" @click="toggleProfile" style="cursor: pointer;">
            <div class="user-info text-end d-none d-sm-flex">
              <span class="user-name">{{ currentUser ? currentUser.full_name : 'Guest' }}</span>
              <span class="user-role" style="text-transform: capitalize;">{{ currentUser ? currentUser.role : 'User' }}</span>
            </div>
            <span class="topbar-avatar d-flex align-items-center justify-content-center">
              <UserRound :size="20" aria-hidden="true" />
            </span>
            
            <!-- Profile Dropdown -->
            <div v-if="showProfileDropdown" class="dropdown-menu dropdown-menu-end show shadow-sm border-0 mt-2" style="right: 0; min-width: 200px; position: absolute;" @click.stop>
              <div class="px-3 py-2 border-bottom d-sm-none">
                <p class="mb-0 fw-bold">{{ currentUser ? currentUser.full_name : 'Guest' }}</p>
                <small class="text-muted text-capitalize">{{ currentUser ? currentUser.role : 'User' }}</small>
              </div>
              <RouterLink to="/profile" class="dropdown-item d-flex align-items-center gap-2 py-2" @click="closeDropdowns">
                <User :size="16" /> Akun Saya
              </RouterLink>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" @click="handleLogout">
                <LogOut :size="16" /> Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="app-content">
        <div class="content-title">
          <h1>{{ pageTitle }}</h1>
          <span>Warehouse Inventory System</span>
        </div>
        <RouterView />
      </main>
    </div>
  </div>
</template>
