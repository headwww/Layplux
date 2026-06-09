import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: () => import('./pages/WelcomePage.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('./pages/EditorPage.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('./pages/SettingsPage.vue'),
    },
  ],
});
