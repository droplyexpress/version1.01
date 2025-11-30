// Configuración de Vite (SOLUCIÓN FINAL: FORZAR ROOT Y PUBLICDIR)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";

// Carga de variables de entorno
dotenv.config();

export default defineConfig(({ mode }) => ({
  // ¡CLAVE! Esto le dice a Vite que su directorio raíz es donde se ejecuta el comando (paginas/client)
  root: path.resolve(__dirname, './'), 
  
  // Base debe ser '/' para la mayoría de los casos
  base: '/', 
  
  // ¡CLAVE! El publicDir debe estar fuera de la raíz si index.html y manifest.json están en la raíz de paginas/client. 
  // O lo deshabilitamos (false) y el index.html se trata como la raíz.
  publicDir: false, 

  server: {
    host: "::",
    port: 8080,
    fs: {
      // Configuraciones de acceso al sistema de archivos
      allow: ["./client", "./paginas", "./src", "./"], 
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  plugins: [react()], 
  resolve: {
    // El alias apunta a la carpeta src dentro del Root Directory
    alias: {
      "@": path.resolve(__dirname, "./src"), 
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
}));
