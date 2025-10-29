// URL del API (ajusta según tu configuración)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/le-rose-vite/api';

export const APP_CONFIG = {
  name: 'Le Rose Boutique Floral',
  tagline: 'Las flores más hermosas para cada ocasión',
  contact: {
    phone: '+51 943 123 456',        // ← CAMBIA ESTO
    email: 'info@lerose.com',        // ← CAMBIA ESTO
    address: 'Chimbote, Ancash, Perú', // ← CAMBIA ESTO
    yapeNumber: '943 123 456'        // ← CAMBIA ESTO
  },
  social: {
    facebook: 'https://facebook.com/tupage',   // ← CAMBIA ESTO
    instagram: 'https://instagram.com/tupage', // ← CAMBIA ESTO
    whatsapp: 'https://wa.me/51943123456'      // ← CAMBIA ESTO
  }
};

export const CATEGORIES = [
  { id: 'all', name: 'Todos' },
  { id: 'ramos', name: 'Ramos' },
  { id: 'arreglos', name: 'Arreglos' },
  { id: 'plantas', name: 'Plantas' },
  { id: 'premium', name: 'Premium' },
  { id: 'packs', name: 'Packs' }
];

export const ORDER_STATUS = {
  pending: { label: 'Pendiente', color: 'warning' },
  processing: { label: 'En Proceso', color: 'info' },
  completed: { label: 'Completado', color: 'success' },
  cancelled: { label: 'Cancelado', color: 'danger' }
};