import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["456fab37ff61.ngrok-free.app"],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
    headers: {
      // Enable motion sensor access (accelerometer, gyroscope) for the app
      // Modern Permissions-Policy syntax uses (self) for same-origin access
      "Permissions-Policy": "accelerometer=(self), gyroscope=(self), magnetometer=(self), microphone=(self), camera=(self), speaker=(self)"
    }
  },
  preview: {
    headers: {
      "Permissions-Policy": "accelerometer=(self), gyroscope=(self), magnetometer=(self), microphone=(self), camera=(self), speaker=(self)"
    }
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
