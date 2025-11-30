// Configuración de Vite (Vercel Root Simplificación)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig(({ mode }) => ({
  // Base debe ser '/'
  base: '/', 
  
  // Directorio publico, relativo a la raiz (paginas/client)
  publicDir: 'public', 

  server: {
    host: "::",
    port: 8080,
    fs: {
      // Permitimos acceso a las carpetas del monorepo
      allow: ["./client", "./paginas", "./src", "./"], 
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  plugins: [react()], 
  resolve: {
    // Alias '@' apunta a './src' dentro del Root Directory
    alias: {
      "@": path.resolve(__dirname, "./src"), 
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    // Directorio de salida, relativo a la carpeta donde se ejecuta la compilación (paginas/client)
    outDir: 'dist',
  }
}));
