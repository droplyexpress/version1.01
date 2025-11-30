import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Ffde2de169eb34402a041e965643302e4?format=webp&width=800"
          alt="Droply Express Logo"
          className="w-64 h-64 object-contain animate-pulse"
        />
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          Droply Express
        </div>
      </div>
    </div>
  );
}
