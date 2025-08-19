import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DetailedDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    environment: import.meta.env.MODE,
    baseUrl: import.meta.env.BASE_URL,
    timestamp: new Date().toISOString(),
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')),
    supabaseStatus: 'checking'
  });

  useEffect(() => {
    // Log to console for debugging
    console.log('Environment Variables Debug:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      MODE: import.meta.env.MODE,
      BASE_URL: import.meta.env.BASE_URL
    });

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.from('transactions').select('count').limit(1);
        if (error) {
          console.log('Supabase connection error:', error);
          setDebugInfo(prev => ({ ...prev, supabaseStatus: 'error' }));
        } else {
          console.log('Supabase connection successful');
          setDebugInfo(prev => ({ ...prev, supabaseStatus: 'connected' }));
        }
      } catch (err) {
        console.log('Supabase connection exception:', err);
        setDebugInfo(prev => ({ ...prev, supabaseStatus: 'error' }));
      }
    };

    testSupabase();
  }, []);

  const getSupabaseStatus = () => {
    switch (debugInfo.supabaseStatus) {
      case 'connected':
        return '✅ Conectado';
      case 'error':
        return '❌ Error de conexión';
      case 'checking':
        return '⏳ Verificando...';
      default:
        return '❓ Desconocido';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50 text-xs max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2">🔍 Detailed Debug Info:</h3>
      <div className="space-y-2">
        <div>
          <strong>Supabase URL:</strong> {debugInfo.hasSupabaseUrl ? '✅ Configurada' : '⚠️ Usando valor por defecto'}
          <br />
          <span className="text-xs opacity-75">Valor: {debugInfo.supabaseUrl || 'undefined (usando fallback)'}</span>
        </div>
        
        <div>
          <strong>Supabase Key (ANON_KEY):</strong> {debugInfo.hasSupabaseKey ? '✅ Configurada' : '⚠️ Usando valor por defecto'}
          <br />
          <span className="text-xs opacity-75">Longitud: {debugInfo.keyLength} caracteres</span>
          <br />
          <span className="text-xs opacity-75">Valor: {debugInfo.supabaseKey ? `${debugInfo.supabaseKey.substring(0, 20)}...` : 'undefined (usando fallback)'}</span>
        </div>

        <div>
          <strong>Supabase Project ID:</strong> {debugInfo.supabaseProjectId ? '✅ Configurado' : '❌ No configurado'}
          <br />
          <span className="text-xs opacity-75">Valor: {debugInfo.supabaseProjectId || 'undefined'}</span>
        </div>

        <div>
          <strong>Supabase Publishable Key:</strong> {debugInfo.supabasePublishableKey ? '✅ Configurado' : '❌ No configurado'}
          <br />
          <span className="text-xs opacity-75">Valor: {debugInfo.supabasePublishableKey ? `${debugInfo.supabasePublishableKey.substring(0, 20)}...` : 'undefined'}</span>
        </div>
        
        <div>
          <strong>Supabase Status:</strong> {getSupabaseStatus()}
        </div>
        
        <div>
          <strong>Environment:</strong> {debugInfo.environment}
        </div>
        
        <div>
          <strong>Base URL:</strong> {debugInfo.baseUrl}
        </div>
        
        <div>
          <strong>Timestamp:</strong> {debugInfo.timestamp}
        </div>
        
        <div>
          <strong>All VITE_ Variables:</strong>
          <ul className="ml-4 mt-1">
            {debugInfo.allEnvVars.map(key => (
              <li key={key}>• {key}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-red-600 rounded">
        <strong>🚨 SOLUCIÓN:</strong>
        <br />
        1. Ir a Vercel Dashboard → Project Settings → Environment Variables
        <br />
        2. Agregar: VITE_SUPABASE_ANON_KEY = [valor completo]
        <br />
        3. Marcar "Production" environment
        <br />
        4. Hacer redeploy
        <br />
        <br />
        <strong>Para desarrollo local:</strong>
        <br />
        Crear archivo .env.local con las variables de entorno
      </div>
    </div>
  );
};

export default DetailedDebug; 