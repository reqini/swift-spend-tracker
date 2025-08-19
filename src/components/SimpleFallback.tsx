const SimpleFallback = () => {
  const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const allVarsConfigured = hasSupabaseUrl && hasSupabaseKey;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Mis Finanzas Rápidas
        </h1>
        
        {allVarsConfigured ? (
          <div className="space-y-2">
            <p className="text-green-600 font-semibold">✅ Variables configuradas correctamente</p>
            <p className="text-muted-foreground">Redirigiendo a la aplicación...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Configurando aplicación...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
        
        <div className="mt-8 text-left text-sm text-muted-foreground space-y-2">
          <p><strong>Supabase URL:</strong> {hasSupabaseUrl ? '✅ Configurada' : '❌ Faltante'}</p>
          <p><strong>Supabase Key:</strong> {hasSupabaseKey ? '✅ Configurada' : '❌ Faltante'}</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>Base URL:</strong> {import.meta.env.BASE_URL}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleFallback; 