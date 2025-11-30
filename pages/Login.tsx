import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [redirectPending, setRedirectPending] = useState(false);

  // Redirect when user is logged in
  useEffect(() => {
    if (redirectPending && currentUser && !authLoading) {
      console.log('User logged in, determining destination:', currentUser.email, 'Role:', currentUser.rol);

      let destination = '/';
      if (currentUser.rol === 'admin') {
        destination = '/admin';
      } else if (currentUser.rol === 'cliente') {
        destination = '/client';
      } else if (currentUser.rol === 'repartidor') {
        destination = '/driver';
      }

      console.log('Navigating to:', destination);
      navigate(destination, { replace: true });
    }
  }, [redirectPending, currentUser, authLoading, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'Contraseña debe tener al menos 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setRedirectPending(false);
    try {
      console.log('Attempting login with email:', email);
      await login(email, password);
      console.log('Login authentication completed, waiting for profile to load...');

      // Set flag to redirect after user loads
      setRedirectPending(true);

      toast({
        title: 'Éxito',
        description: 'Sesión iniciada correctamente',
        duration: 1000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al iniciar sesión. Verifica tus credenciales.';

      console.error('Login error:', errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 3000,
      });
      setRedirectPending(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Ffde2de169eb34402a041e965643302e4?format=webp&width=800"
            alt="Droply Express Logo"
            className="w-48 h-48 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Droply Express</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sistema de Reparto</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-slate-800">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">
              Iniciar Sesión
            </h2>
            <div className="flex gap-2 justify-center mt-4">
              <div className="h-1 flex-1 bg-gradient-to-r from-transparent to-blue-500"></div>
              <div className="h-1 flex-1 bg-gradient-to-l from-transparent to-blue-500"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                placeholder="tu@email.com"
                className={`${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: '' });
                  }
                }}
                placeholder="••••••••"
                className={`${errors.password ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6"
              size="lg"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400">O</span>
            </div>
          </div>

          {/* Driver Option */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('[Login] Navigating to driver install page...');
              navigate('/driver/install');
            }}
            className="w-full py-3 px-4 border-2 border-blue-500 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold rounded-lg transition-colors active:scale-95"
          >
            <span className="text-2xl">🔵</span>
            <div className="mt-1 font-bold">Soy Repartidor</div>
            <div className="text-xs mt-1 opacity-80">Descargar App</div>
          </button>

        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>Droply Express © 2024</p>
        </div>
      </div>
    </div>
  );
}
