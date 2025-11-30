import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Phone, Zap, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __deferredPrompt: any;
  }
}

export default function DriverInstall() {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    console.log('[DriverInstall] Component mounted');
    console.log('[DriverInstall] window.__deferredPrompt:', window.__deferredPrompt);
    console.log('[DriverInstall] User Agent:', navigator.userAgent);
    console.log('[DriverInstall] Is iOS:', navigator.userAgent.toLowerCase().includes('iphone'));
    console.log('[DriverInstall] Is Android:', navigator.userAgent.toLowerCase().includes('android'));

    // Check if prompt was already captured
    if (window.__deferredPrompt) {
      console.log('[DriverInstall] Using previously captured install prompt');
      setInstallPrompt(window.__deferredPrompt);
    }

    // Listen for new install prompt event
    const handleInstallPromptReady = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[DriverInstall] Install prompt ready via custom event', customEvent.detail);
      setInstallPrompt(customEvent.detail);
    };

    window.addEventListener('installPromptReady', handleInstallPromptReady);

    // Also listen for beforeinstallprompt as fallback
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('[DriverInstall] beforeinstallprompt event received');
      setInstallPrompt(e as any);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('installPromptReady', handleInstallPromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isIOS = navigator.userAgent.toLowerCase().includes('iphone');
  const isAndroid = navigator.userAgent.toLowerCase().includes('android');

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        installPrompt.prompt();
        const result = await installPrompt.userChoice;
        console.log('[DriverInstall] User choice:', result.outcome);
        if (result.outcome === 'accepted') {
          console.log('[DriverInstall] App installed successfully');
          setInstallPrompt(null);
          // Navigate to driver app after installation
          setTimeout(() => {
            navigate('/driver');
          }, 1000);
        }
      } catch (error) {
        console.error('[DriverInstall] Install prompt error:', error);
        alert('Hubo un error al intentar instalar. Por favor intenta de nuevo.');
      }
    } else {
      // Fallback for iOS or when prompt isn't available
      console.log('[DriverInstall] No install prompt available');
      if (isIOS) {
        alert('Usa el botón "Compartir" de Safari para agregar esta app a tu pantalla de inicio.');
      } else if (isAndroid) {
        alert('El instalador está cargando. Intenta nuevamente en unos momentos.');
      } else {
        alert('Este navegador no soporta la instalación de apps. Intenta con Chrome o Safari.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white p-6 text-center">
        <h1 className="text-4xl font-bold mb-2">Droply Express</h1>
        <p className="text-blue-100 text-lg">App de Repartidor</p>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* App Icon */}
        <div className="text-center">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Ffde2de169eb34402a041e965643302e4?format=webp&width=200"
            alt="Droply Express Logo"
            className="w-32 h-32 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Droply Repartidor
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">v1.0.0</p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 flex gap-4">
            <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Funciona en tu móvil</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Instálala como una app nativa en iOS y Android</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 flex gap-4">
            <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Rápida y confiable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acceso rápido a todos tus pedidos del día</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700 flex gap-4">
            <Lock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Segura</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tu información protegida y encriptada</p>
            </div>
          </div>
        </div>

        {/* Installation CTA */}
        <div className="space-y-3">
          {!isIOS && (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {installPrompt ? 'Descargar App Ahora' : 'Cargar Instalador'}
            </Button>
          )}

          {isIOS && (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Ver Instrucciones para iOS
            </Button>
          )}

          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Ya tengo cuenta - Iniciar Sesión
          </Button>
        </div>

        {/* Platform-specific Instructions */}
        {isIOS && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
              <span className="text-lg">📱</span>
              Cómo instalar en iPhone
            </h3>
            <ol className="space-y-2 text-sm text-amber-800 dark:text-amber-200 list-decimal list-inside">
              <li><strong>Importante:</strong> Usa el navegador Safari</li>
              <li>Toca el botón <strong>Compartir</strong> (flecha hacia arriba en la barra inferior)</li>
              <li>Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong></li>
              <li>Elige un nombre para la app (puedes dejar el predeterminado)</li>
              <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha</li>
              <li>¡Listo! La app aparecerá en tu pantalla de inicio</li>
            </ol>
          </div>
        )}

        {isAndroid && !installPrompt && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span className="text-lg">⏳</span>
              Cargando...
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              El botón de instalación está cargando. Asegúrate de usar Chrome o un navegador compatible. Si tarda mucho, intenta:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside mt-2 space-y-1">
              <li>Recargar la página</li>
              <li>Limpiar cache del navegador</li>
              <li>Usar una conexión más estable</li>
            </ul>
          </div>
        )}

        {isAndroid && installPrompt && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <span className="text-lg">✓</span>
              Listo para instalar
            </h3>
          </div>
        )}

        {/* Support and Help */}
        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Recargar página
          </Button>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-slate-700">
            <p>¿Problemas con la instalación?</p>
            <a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline block">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-800 mt-8">
        <p>Droply Express © 2024</p>
      </div>
    </div>
  );
}
