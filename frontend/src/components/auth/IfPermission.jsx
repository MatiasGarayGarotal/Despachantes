import { useAppAuth } from '../../contexts/AuthContext';

/**
 * Renderiza children solo si el usuario tiene el permiso indicado.
 *
 * Uso:
 *   <IfPermission code="BTN_CREAR_OPERACION">
 *     <Button>Nueva Operación</Button>
 *   </IfPermission>
 *
 *   <IfPermission code="PAGE_CONFIG" fallback={<p>Sin acceso</p>}>
 *     <ConfigPage />
 *   </IfPermission>
 */
export default function IfPermission({ code, fallback = null, children }) {
  const { hasPermission } = useAppAuth();
  return hasPermission(code) ? children : fallback;
}
