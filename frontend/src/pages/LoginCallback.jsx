/**
 * Zitadel redirige aquí después del login con el código de autorización.
 * react-oidc-context intercepta la URL y procesa el callback automáticamente.
 * Esta página solo muestra un loader mientras eso ocurre.
 */
export default function LoginCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-slate-50">
      <p className="text-slate-500 text-sm">Iniciando sesión...</p>
    </div>
  );
}
