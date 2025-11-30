import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-8 max-w-md w-full shadow-lg border border-red-200 dark:border-red-800">
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-4">
              Error en la Aplicación
            </h1>
            <p className="text-red-800 dark:text-red-200 mb-6 break-words">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Recargar Página
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
              Abre la consola (F12) para ver más detalles
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
