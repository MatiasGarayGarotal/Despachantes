import { useState } from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { AuthProvider, useAppAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import ClientesPage from './pages/ClientesPage';
import ExpedientesPage from './pages/ExpedientesPage';
import CarpetaDetailPage from './pages/CarpetaDetailPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import ContactTypesPage from './pages/ContactTypesPage';
import UsersPage from './pages/UsersPage';
import TiposDocumentoPage from './pages/TiposDocumentoPage';
import ClientDetailPage from './pages/ClientDetailPage';
import WorkflowStatesPage from './pages/WorkflowStatesPage';
import PublicSharePage from './pages/PublicSharePage';
import LoginPage from './pages/LoginPage';

const oidcConfig = {
  authority: import.meta.env.VITE_ZITADEL_AUTHORITY || 'http://localhost:8080',
  client_id: import.meta.env.VITE_ZITADEL_CLIENT_ID || '',
  redirect_uri: window.location.origin + '/',
  post_logout_redirect_uri: window.location.origin + '/',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

function AppShell() {
  const { isAuthenticated, isLoading } = useAppAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nav, setNav] = useState({ page: 'dashboard', context: null });

  const navigate = (page, context = null) => setNav({ page, context });

  // Sidebar resalta la página de origen cuando estamos en detalle
  const sidebarActivePage = nav.page === 'carpeta-detail'
    ? (nav.context?.fromClient ? 'clientes' : 'expedientes')
    : nav.page === 'cliente-detail'
    ? 'clientes'
    : nav.page;

  // Rutas públicas — accesibles sin login
  const shareMatch = window.location.pathname.match(/^\/share\/([a-f0-9]{64})$/);
  if (shareMatch) {
    return <PublicSharePage token={shareMatch[1]} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-slate-50">
        <p className="text-slate-400 text-sm">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleSavedCarpeta = (saved) => {
    setNav(prev => prev.page === 'carpeta-detail'
      ? { ...prev, context: { ...prev.context, carpeta: saved } }
      : prev
    );
  };

  const renderPage = () => {
    switch (nav.page) {
      case 'clientes':
        return <ClientesPage onNavigate={navigate} restoreContext={nav.context} />;
      case 'expedientes':
        return <ExpedientesPage onNavigate={navigate} />;
      case 'carpeta-detail':
        return (
          <CarpetaDetailPage
            carpeta={nav.context?.carpeta}
            fromClient={nav.context?.fromClient}
            onNavigate={navigate}
            onSaved={handleSavedCarpeta}
          />
        );
      case 'cliente-detail':
        return (
          <ClientDetailPage
            clientId={nav.context?.clientId}
            isNew={nav.context?.isNew || false}
            onNavigate={navigate}
            onSaved={() => navigate('clientes')}
          />
        );
      case 'tipos-documento':
        return <TiposDocumentoPage />;
      case 'workflow-states':
        return <WorkflowStatesPage />;
      case 'usuarios':
        return <UsersPage />;
      case 'contact-types':
        return <ContactTypesPage />;
      case 'email-templates':
        return <EmailTemplatesPage />;
      case 'config':
        return <ContactTypesPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-brand-navy text-brand-navy font-sans selection:bg-brand-gold/20 selection:text-brand-navy">
      {/* Header full-width */}
      <Header onMenuToggle={() => setSidebarOpen(v => !v)} />

      {/* Sidebar + contenido */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={sidebarActivePage}
          onNavigate={(page) => navigate(page)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onExpand={() => setSidebarOpen(true)}
        />
        {/* Área de contenido con curva superior-izquierda */}
        <main className="flex-1 overflow-y-auto bg-brand-slate-50 rounded-tl-[40px] shadow-inner min-w-0">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </OidcAuthProvider>
  );
}
