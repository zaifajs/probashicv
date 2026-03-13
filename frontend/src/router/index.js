import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import Dashboard from "../pages/Dashboard.vue";
import CVBuilder from "../pages/CVBuilder.vue";
import PublicCV from "../pages/PublicCV.vue";
import { useAuthStore } from "../store/auth";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/builder/:id?", component: CVBuilder },
  { path: "/cv/:slug", component: PublicCV }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Guest-first flow: never force login before CV building.
    if (to.path.startsWith("/dashboard")) {
      return "/builder";
    }
    return "/login";
  }
  return true;
});
