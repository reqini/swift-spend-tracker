import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const registration = await registerServiceWorker();
      if (registration) {
        await registration.showNotification(title, {
          body: '¿Registrar este movimiento como gasto?',
          icon: '/pwa-512x512.png',
          badge: '/pwa-512x512.png',
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
    return false;
  };

  const scheduleExpenseDetection = () => {
    // Simulate expense detection every 30 seconds for demo
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance
        showNotification('Posible Gasto Detectado');
      }
    }, 30000);
  };

  return {
    permission,
    isSupported,
    requestPermission,
    registerServiceWorker,
    showNotification,
    scheduleExpenseDetection
  };
};