// Configuración PWA
export const PWA_CONFIG = {
  name: 'Mis Finanzas Rápidas',
  shortName: 'FinanzasApp',
  description: 'App móvil para control rápido de finanzas personales y familiares',
  themeColor: '#3b82f6',
  backgroundColor: '#0f172a',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  startUrl: '/',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    }
  ]
};

// Función para verificar si la app está instalada
export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Verificar si está en modo standalone (instalado)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Verificar si está en modo fullscreen (instalado en iOS)
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return true;
  }
  
  // Verificar si está en modo minimal-ui (instalado en algunos navegadores)
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true;
  }
  
  return false;
};

// Función para verificar si el navegador soporta PWA
export const isPWASupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Función para instalar la app
export const installApp = async (): Promise<boolean> => {
  if (!isPWASupported()) {
    console.log('PWA no soportado en este navegador');
    return false;
  }
  
  // Buscar el evento beforeinstallprompt
  const promptEvent = (window as { deferredPrompt?: Event }).deferredPrompt;
  
  if (!promptEvent) {
    console.log('No hay prompt de instalación disponible');
    return false;
  }
  
  try {
    // Mostrar el prompt de instalación
    promptEvent.prompt();
    
    // Esperar la respuesta del usuario
    const { outcome } = await promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la app');
      return true;
    } else {
      console.log('Usuario rechazó instalar la app');
      return false;
    }
  } catch (error) {
    console.error('Error al instalar la app:', error);
    return false;
  }
};

// Función para registrar el service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPWASupported()) {
    console.log('Service Worker no soportado');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado:', registration);
    return registration;
  } catch (error) {
    console.error('Error al registrar Service Worker:', error);
    return null;
  }
};

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notificaciones no soportadas');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    return false;
  }
}; 