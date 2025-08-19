import { useState, useEffect } from 'react';

const DebugApp = () => {
  const [debugInfo, setDebugInfo] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    hasSupabaseUrl: false,
    hasSupabaseKey: false,
    environment: '',
    timestamp: '',
    errors: [] as string[]
  });

  useEffect(() => {
    // Capturar errores de JavaScript
    const handleError = (event: ErrorEvent) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, event.message]
      }));
    };

    window.addEventListener('error', handleError);
    
    // Verificar variables de entorno
    setDebugInfo({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'undefined',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'undefined',
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
      errors: []
    });

    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Mis Finanzas Rápidas
          </h1>
          <p className="text-muted-foreground mt-2">
            Debug Mode - Diagnosticando aplicación
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4 space-y-3">
          <div>
            <strong>Supabase URL:</strong> {debugInfo.hasSupabaseUrl ? '✅ Configurada' : '❌ Faltante'}
            <br />
            <span className="text-xs text-muted-foreground">
              {debugInfo.supabaseUrl}
            </span>
          </div>

          <div>
            <strong>Supabase Key:</strong> {debugInfo.hasSupabaseKey ? '✅ Configurada' : '❌ Faltante'}
            <br />
            <span className="text-xs text-muted-foreground">
              {debugInfo.supabaseKey}
            </span>
          </div>

          <div>
            <strong>Environment:</strong> {debugInfo.environment}
          </div>

          <div>
            <strong>Timestamp:</strong> {debugInfo.timestamp}
          </div>

          {debugInfo.errors.length > 0 && (
            <div>
              <strong>Errores:</strong>
              <ul className="text-xs text-red-600 mt-1">
                {debugInfo.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Si ves "❌ Faltante" en Supabase Key, necesitas configurar las variables de entorno en Vercel.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugApp; 