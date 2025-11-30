import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Package, Users, ArrowRight, MapPin, Clock, Shield } from "lucide-react";

export default function Index() {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // User is already logged in, redirect to their dashboard
      if (currentUser.rol === 'admin') {
        navigate('/admin', { replace: true });
      } else if (currentUser.rol === 'cliente') {
        navigate('/client', { replace: true });
      } else if (currentUser.rol === 'repartidor') {
        navigate('/driver', { replace: true });
      }
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 bg-white dark:bg-slate-950 bg-opacity-95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Ff777622996b8401ca39fac9aea344ec9?format=webp&width=800"
              alt="Droply Express"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-primary dark:text-primary">Droply Express</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span className="text-sm font-medium text-primary">Solución de Reparto Exprés Líder</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Reparto Rápido,
            <span className="text-primary"> Confiable y En Tiempo Real</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
            Droply Express conecta clientes, administradores y repartidores en una plataforma única. 
            Gestiona pedidos en tiempo real, asigna rutas inteligentes y mantén el control total de tus entregas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Iniciar Sesión
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
            >
              Conocer Más
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Admin Module */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-primary/10">
            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Panel Administrativo
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Gestiona todos los pedidos, asigna repartidores, ve el estado en tiempo real y genera reportes.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Lista centralizada de pedidos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Asignación inteligente de repartidores</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">��</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Filtros por cliente, fecha y estado</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Descargar reportes en PDF/Excel</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Acceder <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Client Module */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-primary/10">
            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Portal del Cliente
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Crea pedidos, sigue el estado de tus entregas y recibe notificaciones en tiempo real.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Crear pedidos en segundos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Seguimiento en tiempo real</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Notificaciones automáticas</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Historial de pedidos</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Acceder <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Driver Module */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-primary/10">
            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-6">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Fa886f79a8a774641a790f442f2e15190?format=webp&width=150"
                alt="App Repartidor"
                className="w-8 h-8 object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              App del Repartidor
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Accede a tus pedidos asignados, actualiza estados y completa entregas fácilmente.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Pedidos asignados en tiempo real</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Rutas optimizadas con Google Maps</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Captura de fotos de entrega</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">•</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Actualización instantánea de estado</span>
              </li>
            </ul>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Acceder <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 dark:bg-slate-900 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            ¿Por qué Droply Express?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Tiempo Real
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sincronización instantánea de estado para admin, cliente y repartidor en todo momento.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Google Maps Integrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Planifica rutas óptimas y visualiza entregas en el mapa en tiempo real.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                Seguro y Confiable
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Autenticación segura con roles específicos y base de datos en la nube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 sm:p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            ¿Listo para optimizar tus entregas?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Droply Express es la solución completa para tu negocio de reparto. 
            Comienza hoy mismo y acelera tus operaciones.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Ingresar al Sistema
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-6 sm:mb-0">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Fa886f79a8a774641a790f442f2e15190?format=webp&width=100"
                alt="Droply Express"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-slate-900 dark:text-white">Droply Express</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Droply Express. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
