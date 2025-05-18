import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue'),
    meta: { requiresAuth: true, requiresSetup: true }
  },
  {
    path: '/conversation',
    name: 'Conversation',
    component: Home, // Using existing Home component as conversation view
    meta: { requiresAuth: true, requiresSetup: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    // Lazy loading for reports page
    component: () => import(/* webpackChunkName: "reports" */ '../views/Reports.vue'),
    meta: { requiresAuth: true, requiresSetup: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    // Lazy loading for settings page
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue'),
    meta: { requiresAuth: true, requiresSetup: true }
  },
  {
    path: '/business-type',
    name: 'BusinessTypeSelection',
    component: () => import(/* webpackChunkName: "business-type" */ '../views/BusinessTypeSelection.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/business-setup',
    name: 'BusinessSetup',
    component: () => import(/* webpackChunkName: "business-setup" */ '../views/BusinessSetup.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '../views/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import(/* webpackChunkName: "signup" */ '../views/Signup.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import(/* webpackChunkName: "forgot-password" */ '../views/ForgotPassword.vue'),
    meta: { guestOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Import isAuthenticated utility
import { isAuthenticated } from '../utils/syncUtils';

// Navigation guards for authentication and setup
router.beforeEach((to, from, next) => {
  const authenticated = isAuthenticated();
  let hasSetupAccount = false;
  
  // Check hasSetupAccount in multiple places for reliability
  // 1. First check the user object
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.hasSetupAccount) {
    hasSetupAccount = true;
  }
  
  // 2. Then check the global flag
  if (localStorage.getItem('hasSetupAccount') === 'true') {
    hasSetupAccount = true;
  }
  
  // 3. Finally check the namespaced flag if we have a user ID
  if (user && user.id) {
    const namespacedKey = `finance-chat-account-setup-${user.id}`;
    if (localStorage.getItem(namespacedKey) === 'true') {
      hasSetupAccount = true;
    }
  }
  
  console.log('Navigation guard - Auth status:', authenticated);
  console.log('Navigation guard - Account setup status:', hasSetupAccount);
  console.log('Navigation guard - Route:', to.path);
  
  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authenticated) {
      console.log('Not authenticated, redirecting to Login');
      next({ name: 'Login' });
    } 
    // Routes that require business setup
    else if (to.matched.some(record => record.meta.requiresSetup) && !hasSetupAccount) {
      console.log('Not set up, redirecting to BusinessTypeSelection');
      next({ name: 'BusinessTypeSelection' });
    } 
    else {
      console.log('Authenticated and setup complete, proceeding');
      next();
    }
  } 
  // Routes that are for guests only (login, signup, etc.)
  else if (to.matched.some(record => record.meta.guestOnly)) {
    if (authenticated) {
      // If authenticated, check if setup is complete
      if (hasSetupAccount) {
        console.log('Already authenticated and setup, redirecting to Dashboard');
        next({ name: 'Dashboard' });
      } else {
        console.log('Authenticated but not set up, redirecting to BusinessTypeSelection');
        next({ name: 'BusinessTypeSelection' });
      }
    } else {
      next();
    }
  } else {
    next();
  }
})

export default router
