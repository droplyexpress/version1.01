import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';

export function AuthHeader() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Sesión Cerrada',
        description: 'Tu sesión ha sido cerrada exitosamente',
        duration: 2000,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cerrar sesión',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    cliente: 'Cliente',
    repartidor: 'Repartidor',
  };

  return (
    <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Fa886f79a8a774641a790f442f2e15190?format=webp&width=100"
            alt="Droply Express"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Droply Express</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {roleLabels[currentUser?.rol || 'cliente']}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg">
            <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {currentUser?.nombre}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {currentUser?.email}
              </p>
            </div>
            {currentUser?.rol === 'repartidor' && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-300 dark:border-slate-700">
                <span className={`w-2 h-2 rounded-full ${
                  currentUser?.online_status === 'online'
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                }`}></span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {currentUser?.online_status === 'online' ? 'En línea' : 'Desconectado'}
                </span>
              </div>
            )}
          </div>
          {currentUser?.rol === 'cliente' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center gap-2"
              title="Cambiar contraseña"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Cambiar Contraseña</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          userId={currentUser?.id || ''}
        />
      </div>
    </header>
  );
}
