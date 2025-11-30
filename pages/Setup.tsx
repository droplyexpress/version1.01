import { AdminSetupWizard } from '@/components/AdminSetupWizard';

export default function Setup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="text-center mb-8">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Fac0733f9e4544c449dd919f4664edbd3%2Fa886f79a8a774641a790f442f2e15190?format=webp&width=150"
          alt="Droply Express"
          className="w-16 h-16 mx-auto mb-4 object-contain"
        />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Droply Express</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Admin Setup</p>
      </div>

      {/* Setup Wizard */}
      <AdminSetupWizard />

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>Droply Express © 2024</p>
      </div>
    </div>
  );
}
