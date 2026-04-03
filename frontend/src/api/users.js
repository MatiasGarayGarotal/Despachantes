import api from './api';

/**
 * Obtiene el perfil del usuario logueado (id, email, fullName, role).
 * Se llama UNA VEZ al hacer login. El resultado se guarda en AuthContext.
 *
 * El backend devuelve el rol leído directamente del JWT de Zitadel.
 * El frontend deriva los permisos de UI a partir del rol usando
 * el mapa estático rolePermissions.js — sin lógica en BD.
 */
export async function getMyInfo() {
  const response = await api.get('/users/me/permissions');
  return response.data;
}
