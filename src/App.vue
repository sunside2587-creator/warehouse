<script setup>
import { computed, ref } from 'vue';
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
} from 'lucide-vue-next';
import { LogOut } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isSidebarOpen = ref(false);

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produk', icon: PackageSearch },
  { to: '/transactions', label: 'Transaksi Stok', icon: ArrowLeftRight },
];

const pageTitle = computed(
  () =>
    ({
      dashboard: 'Dashboard',
      products: 'Produk Gudang',
      transactions: 'Transaksi Stok',
      login: 'Login',
    })[route.name] || 'Inventaris Gudang',
);

const currentUser = computed(() => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
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
        <RouterLink v-for="item in navItems" :key="item.to" class="sidebar-link" :to="item.to">
          <component :is="item.icon" :size="18" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>

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
          
          <button class="topbar-icon" type="button" title="Notifikasi" style="position: relative;">
            <Bell :size="19" aria-hidden="true" />
            <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style="margin-top: 6px; margin-left: -6px;"></span>
          </button>

          <button class="topbar-icon d-xl-none" type="button" title="Menu" @click="toggleSidebar">
            <Menu :size="20" aria-hidden="true" />
          </button>

          <div class="topbar-divider d-none d-sm-block"></div>

          <div class="user-profile">
            <div class="user-info text-end d-none d-sm-flex">
              <span class="user-name">{{ currentUser ? currentUser.full_name : 'Guest' }}</span>
              <span class="user-role" style="text-transform: capitalize;">{{ currentUser ? currentUser.role : 'User' }}</span>
            </div>
            <span class="topbar-avatar d-flex align-items-center justify-content-center">
              <UserRound :size="20" aria-hidden="true" />
            </span>
          </div>

          <button class="topbar-icon text-danger ms-2" type="button" title="Logout" @click="handleLogout">
            <LogOut :size="18" aria-hidden="true" />
          </button>
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
