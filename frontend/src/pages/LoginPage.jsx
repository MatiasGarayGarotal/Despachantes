import { useAppAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, isLoading } = useAppAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-slate-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-brand-navy tracking-tight">
          Despachantes
        </h1>
        <p className="text-sm text-slate-500 text-center">
          Sistema de gestión aduanera
        </p>
        <button
          onClick={login}
          disabled={isLoading}
          className="w-full bg-brand-navy text-white py-3 rounded-xl font-medium
                     hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Cargando...' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
