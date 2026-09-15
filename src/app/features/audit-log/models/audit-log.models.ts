export interface AuditLogActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
  // El controller no le pone alias al include de User — según cómo esté
  // asociado en tu models/index.js, la clave puede llegar como "User" o
  // "user". Se aceptan las dos para no depender de adivinar cuál es.
  User?: AuditLogActor | null;
  user?: AuditLogActor | null;
}

/** Nombres legibles para las acciones que ya quedaron conectadas — si aparece una que no está aquí, se muestra tal cual. */
export const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario editado',
  USER_DELETED: 'Usuario eliminado',
  USER_ROLES_CHANGED: 'Roles de usuario cambiados',
  USER_PASSWORD_RESET_BY_ADMIN: 'Contraseña reseteada por admin',
  RESTAURANT_PROFILE_UPDATED: 'Perfil del restaurante editado',
  RESTAURANT_LOGO_CHANGED: 'Logo cambiado',
  SETTINGS_UPDATED: 'Configuración editada',
  ORDER_CANCELLED: 'Pedido cancelado',
};

export const ENTITY_TYPE_OPTIONS = ['User', 'Restaurant', 'RestaurantSetting', 'Order'];