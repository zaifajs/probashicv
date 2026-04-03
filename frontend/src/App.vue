<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./store/auth";
import { useI18n } from "vue-i18n";

const route = useRoute();
const auth = useAuthStore();
const { locale, t } = useI18n();
const LANGUAGE_STORAGE_KEY = "cv_builder_ui_language";
const LEGACY_LANGUAGE_STORAGE_KEY = "probashicv_ui_language";
const currentLocale = computed(() => locale.value);
const mobileMenuOpen = ref(false);
const feedbackEmail = computed(() => {
  const user = ["h", "i"].join("");
  const domain = ["huzaifa", ".", "me"].join("");
  return `${user}@${domain}`;
});
const feedbackHref = computed(() => `mailto:${feedbackEmail.value}`);

function setLocale(nextLocale) {
  locale.value = nextLocale;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  mobileMenuOpen.value = false;
}

function logout() {
  auth.logout();
  mobileMenuOpen.value = false;
}

function isActive(path) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

onMounted(() => {
  const saved =
    localStorage.getItem(LANGUAGE_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (saved && ["en", "bn", "pt"].includes(saved)) {
    locale.value = saved;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, saved);
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  }
});

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  }
);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="header-dashboard">
      <div class="header-inner">
        <router-link to="/" class="header-logo">
          <span class="header-logo-text">CV Builder</span>
        </router-link>

        <button
          type="button"
          class="header-mobile-toggle"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          aria-controls="mobile-menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span class="sr-only">Toggle menu</span>
          <svg v-if="!mobileMenuOpen" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <nav class="header-nav hidden md:flex md:flex-wrap md:items-center md:gap-1">
          <router-link
            to="/"
            class="header-link"
            :class="{ 'header-link--active': isActive('/') && route.path === '/' }"
          >
            {{ t("nav.home") }}
          </router-link>
          <router-link
            to="/builder"
            class="header-link"
            :class="{ 'header-link--active': isActive('/builder') }"
          >
            Builder
          </router-link>
          <router-link
            v-if="auth.isAuthenticated"
            to="/dashboard"
            class="header-link"
            :class="{ 'header-link--active': isActive('/dashboard') }"
          >
            {{ t("nav.dashboard") }}
          </router-link>

          <span class="header-divider" aria-hidden="true" />

          <template v-if="!auth.isAuthenticated">
            <router-link to="/login" class="header-link" :class="{ 'header-link--active': isActive('/login') }">
              {{ t("nav.login") }}
            </router-link>
            <router-link
              to="/register"
              class="header-link header-link--cta"
              :class="{ 'header-link--active': isActive('/register') }"
            >
              {{ t("nav.register") }}
            </router-link>
          </template>
          <template v-else>
            <button type="button" class="header-btn-logout" @click="logout">
              {{ t("nav.logout") }}
            </button>
          </template>

          <span class="header-divider" aria-hidden="true" />

          <div class="header-lang">
            <label for="header-lang-select" class="sr-only">Language</label>
            <select
              id="header-lang-select"
              :value="currentLocale"
              @change="(e) => setLocale(e.target.value)"
              class="header-lang-select"
            >
              <option value="en">EN</option>
              <option value="bn">BN</option>
              <option value="pt">PT</option>
            </select>
          </div>
        </nav>
      </div>

      <nav v-if="mobileMenuOpen" id="mobile-menu" class="header-mobile-nav md:hidden">
        <router-link
          to="/"
          class="header-mobile-link"
          :class="{ 'header-mobile-link--active': isActive('/') && route.path === '/' }"
        >
          {{ t("nav.home") }}
        </router-link>
        <router-link
          to="/builder"
          class="header-mobile-link"
          :class="{ 'header-mobile-link--active': isActive('/builder') }"
        >
          Builder
        </router-link>
        <router-link
          v-if="auth.isAuthenticated"
          to="/dashboard"
          class="header-mobile-link"
          :class="{ 'header-mobile-link--active': isActive('/dashboard') }"
        >
          {{ t("nav.dashboard") }}
        </router-link>

        <template v-if="!auth.isAuthenticated">
          <router-link to="/login" class="header-mobile-link" :class="{ 'header-mobile-link--active': isActive('/login') }">
            {{ t("nav.login") }}
          </router-link>
          <router-link
            to="/register"
            class="header-mobile-link header-mobile-link--cta"
            :class="{ 'header-mobile-link--active': isActive('/register') }"
          >
            {{ t("nav.register") }}
          </router-link>
        </template>
        <template v-else>
          <button type="button" class="header-mobile-link text-left" @click="logout">
            {{ t("nav.logout") }}
          </button>
        </template>

        <div class="header-mobile-lang">
          <label for="header-lang-select-mobile" class="sr-only">Language</label>
          <select
            id="header-lang-select-mobile"
            :value="currentLocale"
            @change="(e) => setLocale(e.target.value)"
            class="header-lang-select w-full"
          >
            <option value="en">EN</option>
            <option value="bn">BN</option>
            <option value="pt">PT</option>
          </select>
        </div>
      </nav>
    </header>

    <main class="container-default flex-1 pb-6">
      <router-view />
    </main>

    <footer class="app-footer">
      <div class="app-footer-inner">
        <p>
          {{ t("footer.credit") }}
          <span class="mx-1">|</span>
          {{ t("footer.feedbackLabel") }}
          <a class="footer-link" :href="feedbackHref">{{ feedbackEmail }}</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.header-dashboard {
  @apply border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.92));
}

.header-inner {
  @apply mx-auto flex w-full max-w-[90rem] flex-wrap items-center justify-between gap-4 px-4;
  padding: 0.75rem 1rem;
  min-height: 3.5rem;
}

.header-logo {
  @apply flex items-center gap-2 no-underline outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded;
}

.header-logo-text {
  @apply text-xl font-bold tracking-tight text-slate-900;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-mobile-toggle {
  @apply inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 md:hidden;
}

.header-mobile-nav {
  @apply mx-auto mb-2 flex w-full max-w-[90rem] flex-col gap-1 px-4;
}

.header-mobile-link {
  @apply rounded-lg px-3 py-2 text-sm font-medium text-slate-700 no-underline transition hover:bg-slate-100;
}

.header-mobile-link--active {
  @apply bg-brand-50 text-brand-700;
}

.header-mobile-link--cta {
  @apply bg-brand-600 text-white hover:bg-brand-700;
}

.header-mobile-link--cta.header-mobile-link--active {
  @apply bg-brand-600 text-white;
}

.header-mobile-lang {
  @apply mt-2 border-t border-slate-200 pt-2;
}

.header-link {
  @apply relative rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2;
}
.header-link:hover {
  @apply text-slate-900 bg-slate-100/80;
}
.header-link--active {
  @apply text-brand-600 bg-brand-50;
}
.header-link--active:hover {
  @apply text-brand-700 bg-brand-50;
}
.header-link--cta {
  @apply bg-brand-600 text-white;
}
.header-link--cta:hover {
  @apply bg-brand-700 text-white;
}
.header-link--cta.header-link--active {
  @apply bg-brand-600 text-white;
}

.header-divider {
  @apply w-px h-5 bg-slate-200 mx-1 self-center;
}

.header-btn-logout {
  @apply rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 hover:bg-slate-100 hover:text-slate-900;
}

.header-lang {
  @apply flex items-center;
}

.header-lang-select {
  @apply rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-2.5 pr-9 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 hover:border-slate-300 hover:bg-white;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.35rem center;
  background-size: 1.25rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.app-footer {
  @apply border-t border-slate-200/90 bg-white/95;
}

.app-footer-inner {
  @apply mx-auto w-full max-w-[90rem] px-4 py-3 text-center text-xs text-slate-500;
}

.footer-link {
  @apply font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-brand-600;
}
</style>
