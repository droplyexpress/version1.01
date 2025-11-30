/**
 * Configuración de Vite para el proyecto.
 * Define la ruta base para que Vercel sepa dónde encontrar los archivos
 * si la aplicación está en una subcarpeta (paginas/client).
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno (solo para desarrollo local)
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ¡CLAVE! Especifica la ruta base donde se encuentra la aplicación.
  // Esto soluciona el problema de "Root Directory" de Vercel.
  base: mode === 'production' ? '/paginas/client/' : '/', 
  
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Permitir acceso a carpetas client y shared
      allow: ["./client", "./shared", "./paginas"],
      // Denegar acceso a archivos sensibles
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    // Vercel usará el directorio de salida por defecto (dist)
    // No especificamos 'outDir' para evitar el primer error 404
  },
  plugins: [react()], 
  resolve: {
    alias: {
      // Ajustar la ruta de acceso al cliente, que ahora está dentro de 'paginas'
      "@": path.resolve(__dirname, "./paginas/client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
}));
