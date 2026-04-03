import api from './api';

/**
 * Lista todos los usuarios internos de la agencia.
 * El backend consulta la Zitadel Management API y devuelve
 * { id, firstName, lastName, displayName, email, userName, role, state }.
 */
export async function listInternalUsers() {
    const response = await api.get('/users');
    return response.data;
}

/**
 * Crea un nuevo usuario interno en Zitadel y le asigna un rol.
 * Zitadel envía automáticamente un email de inicialización al usuario.
 *
 * @param {{ firstName, lastName, email, role }} data
 */
export async function createInternalUser(data) {
    const response = await api.post('/users', data);
    return response.data;
}

/**
 * Retorna la lista de roles asignables a usuarios internos.
 * [{ key: 'emp_adm', label: 'Empleado Administrativo' }, ...]
 */
export async function getAssignableRoles() {
    const response = await api.get('/users/roles');
    return response.data;
}

/**
 * Desactiva un usuario en Zitadel (estado → Inactivo, no puede iniciar sesión).
 * Los datos y grants se conservan.
 * @param {string} userId
 */
export async function deactivateInternalUser(userId) {
    await api.delete(`/users/${userId}`);
}

/**
 * Reactiva un usuario previamente desactivado.
 * @param {string} userId
 */
export async function reactivateInternalUser(userId) {
    await api.post(`/users/${userId}/reactivate`);
}

/**
 * Reemplaza la lista completa de roles de un usuario.
 * Enviar la lista final deseada; el backend hace PUT sobre el grant existente en Zitadel.
 * @param {string}   userId
 * @param {string[]} roles  — lista de roleKeys (ej. ['emp_adm', 'jefe'])
 */
export async function updateInternalUserRoles(userId, roles) {
    await api.patch(`/users/${userId}/roles`, { roles });
}
