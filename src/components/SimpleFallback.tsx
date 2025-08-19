const SimpleFallback = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Mis Finanzas Rápidas
        </h1>
        <p className="text-muted-foreground">
          Cargando aplicación...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        
        <div className="mt-8 text-left text-sm text-muted-foreground space-y-2">
          <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante'}</p>
          <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante'}</p>
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>Base URL:</strong> {import.meta.env.BASE_URL}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleFallback; 