import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { setAuthToken } from '../api/api';
import { getMyInfo } from '../api/users';
import { getPermissionsForRoles } from '../utils/rolePermissions';

const AuthContext = createContext(null);

/**
 * AuthProvider envuelve la app y expone:
 *   - user: { id, email, fullName, roles: string[] }
 *   - hasPermission(code): retorna true si cualquiera de los roles del usuario tiene ese permiso
 *   - isLoading, isAuthenticated, login, logout
 *
 * Los permisos se calculan desde los roles usando el mapa estático rolePermissions.js.
 * Soporta multi-rol: los permisos se unen (union) entre todos los roles asignados.
 */
export function AuthProvider({ children }) {
  const oidc = useOidcAuth();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(new Set());
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  useEffect(() => {
    if (oidc.isAuthenticated && oidc.user?.access_token) {
      setAuthToken(oidc.user.access_token);
      loadUserInfo();
    } else {
      setAuthToken(null);
      setUser(null);
      setPermissions(new Set());
    }
  }, [oidc.isAuthenticated, oidc.user?.access_token]);

  async function loadUserInfo() {
    setIsLoadingInfo(true);
    try {
      const data = await getMyInfo();
      // El backend devuelve List<String> roles (multi-rol)
      const roles = (data.roles ?? []).map(r => r.toLowerCase()).filter(Boolean);
      const effectiveRoles = roles.length > 0 ? roles : ['emp_adm'];

      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        roles: effectiveRoles,
        // role primario (primer rol) — para compatibilidad con componentes que muestran un solo label
        role: effectiveRoles[0],
      });
      setPermissions(getPermissionsForRoles(effectiveRoles));
    } catch (error) {
      console.error('Error cargando perfil de usuario:', error);
    } finally {
      setIsLoadingInfo(false);
    }
  }

  const hasPermission = (code) => permissions.has(code);

  const isLoading = oidc.isLoading || isLoadingInfo;

  return (
    <AuthContext.Provider value={{
      user,
      hasPermission,
      isLoading,
      isAuthenticated: oidc.isAuthenticated,
      login: () => oidc.signinRedirect(),
      logout: () => oidc.signoutRedirect(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth debe usarse dentro de AuthProvider');
  return ctx;
}
