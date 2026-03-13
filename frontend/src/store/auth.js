import { defineStore } from "pinia";
import { authService } from "../services/authService";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    user: JSON.parse(localStorage.getItem("user") || "null")
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    async register(payload) {
      const result = await authService.register(payload);
      this.setSession(result);
    },
    async login(payload) {
      const result = await authService.login(payload);
      this.setSession(result);
    },
    setSession({ token, user }) {
      this.token = token;
      this.user = user;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
});
