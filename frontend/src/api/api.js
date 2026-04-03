import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor: agrega el token de Zitadel en cada request.
 * El token se guarda en sessionStorage por react-oidc-context.
 * Se llama setAuthToken() desde el AuthProvider al hacer login.
 */
let currentToken = null;

export function setAuthToken(token) {
  currentToken = token;
}

api.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido — el AuthProvider se encarga del re-login
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
