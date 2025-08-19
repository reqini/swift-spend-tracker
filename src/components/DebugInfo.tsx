import { useEffect, useState } from 'react';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
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
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50 text-xs">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};

export default DebugInfo; 