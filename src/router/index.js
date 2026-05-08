import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import ProductsView from '../views/ProductsView.vue';
import TransactionsView from '../views/TransactionsView.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
  },
  {
    path: '/products',
    name: 'products',
    component: ProductsView,
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
