// --- COPIAR DESDE AQUÍ ---
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno (solo para desarrollo local)
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Se han eliminado las importaciones y plugins relacionados con el servidor (backend).
// La aplicación ahora solo se compila como frontend estático.

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Permitir acceso a carpetas client y shared
      allow: ["./client", "./shared"],
      // Denegar acceso a archivos sensibles
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    // Carpeta de salida para la parte visible (cliente)
    outDir: "dist/spa",
  },
  // SOLO se incluye el plugin de React, se elimina el plugin de Express (servidor)
  plugins: [react()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
}));
// --- HASTA AQUÍ ---
