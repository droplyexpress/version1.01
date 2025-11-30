// Configuración de Vite (SOLUCIÓN FINAL DE RUTAS)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Forzando cache-bust
export default defineConfig(({ mode }) => ({
  // ¡CLAVE! Esto soluciona el error 404 de main.tsx y sw.js
  // Fuerza a Vite a generar todas las rutas de assets desde la raíz del dominio.
  base: '/', 
  
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Configuraciones de acceso al sistema de archivos
      allow: ["./client", "./paginas"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  plugins: [react()], 
  resolve: {
    // Aseguramos que los alias apunten a la subcarpeta
    alias: {
      "@": path.resolve(__dirname, "./paginas/client"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
}));
