import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

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
          vibrate: [200, 100, 200],
          requireInteraction: true,
          ...options
        });
        return true;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
    return false;
  };

  // Detectar transferencias y pagos desde el portapapeles
  const startClipboardMonitoring = () => {
    if (!isSupported || permission !== 'granted') return;

    setIsMonitoring(true);
    
    // Monitorear cambios en el portapapeles cada 2 segundos
    const interval = setInterval(async () => {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          const detectedTransaction = detectTransactionFromText(clipboardText);
          if (detectedTransaction) {
            await showNotification('Transacción Detectada', {
              body: `Se detectó: ${detectedTransaction.description}`,
              tag: 'transaction-detection',
              data: detectedTransaction,
              actions: [
                {
                  action: 'register',
                  title: 'Registrar',
                  icon: '/pwa-192x192.png'
                },
                {
                  action: 'ignore',
                  title: 'Ignorar',
                  icon: '/pwa-192x192.png'
                }
              ]
            });
          }
        }
      } catch (error) {
        // Error de permisos del portapapeles - normal en algunos navegadores
        console.log('Clipboard access not available:', error);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  };

  // Detectar transacciones desde texto (SMS, emails, etc.)
  const detectTransactionFromText = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Patrones comunes de transferencias y pagos
    const patterns = [
      // Transferencias bancarias
      {
        regex: /transferencia.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        type: 'expense' as const,
        description: 'Transferencia bancaria'
      },
      // Pagos con tarjeta
      {
        regex: /pago.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        type: 'expense' as const,
        description: 'Pago con tarjeta'
      },
      // Débitos automáticos
      {
        regex: /débito.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        type: 'expense' as const,
        description: 'Débito automático'
      },
      // Ingresos/salarios
      {
        regex: /acreditación.*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        type: 'income' as const,
        description: 'Acreditación bancaria'
      },
      // CBU/Alias patterns
      {
        regex: /(?:cbu|alias).*?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/i,
        type: 'expense' as const,
        description: 'Transferencia por CBU/Alias'
      }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const amount = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(amount) && amount > 0) {
          return {
            amount,
            type: pattern.type,
            description: pattern.description,
            detectedText: text.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return null;
  };

  // Simular detección para testing
  const simulateExpenseDetection = () => {
    const mockDetections = [
      "Transferencia enviada a Juan Pérez por $15,000.00",
      "Pago con tarjeta en Supermercado Coto por $8,500.00",
      "Débito automático de servicios por $3,200.00",
      "Transferencia recibida de María García por $25,000.00",
      "Pago con tarjeta en estación de servicio por $5,800.00"
    ];
    
    const randomDetection = mockDetections[Math.floor(Math.random() * mockDetections.length)];
    const detectedTransaction = detectTransactionFromText(randomDetection);
    
    if (detectedTransaction) {
      showNotification('Transacción Detectada', {
        body: `Se detectó: ${detectedTransaction.description}`,
        tag: 'transaction-detection',
        data: detectedTransaction,
        actions: [
          {
            action: 'register',
            title: 'Registrar',
            icon: '/pwa-192x192.png'
          },
          {
            action: 'ignore',
            title: 'Ignorar',
            icon: '/pwa-192x192.png'
          }
        ]
      });
    }
  };

  return {
    permission,
    isSupported,
    isMonitoring,
    requestPermission,
    registerServiceWorker,
    showNotification,
    startClipboardMonitoring,
    detectTransactionFromText,
    simulateExpenseDetection
  };
};