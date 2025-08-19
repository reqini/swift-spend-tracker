import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { X, Bug, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DebugLog {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  source?: string;
}

interface SimpleDebugProps {
  isVisible: boolean;
  onToggle: () => void;
}

const SimpleDebug: React.FC<SimpleDebugProps> = ({ isVisible, onToggle }) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);

  // Función segura para agregar logs
  const addLog = useCallback((type: DebugLog['type'], message: string, source?: string) => {
    const newLog: DebugLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      timestamp: new Date(),
      source: source || 'console'
    };

    setLogs(prev => [newLog, ...prev.slice(0, 19)]); // Solo 20 logs máximo

    if (type === 'error') {
      setErrorCount(prev => prev + 1);
    } else if (type === 'warning') {
      setWarningCount(prev => prev + 1);
    }
  }, []);

  // Interceptar errores solo cuando está visible
  useEffect(() => {
    if (!isVisible) return;

    // Agregar log inicial
    addLog('info', '🔍 Debug iniciado', 'system');

    // Interceptar errores no manejados
    const handleUnhandledError = (event: ErrorEvent) => {
      addLog('error', `Error: ${event.error?.message || event.message}`, 'unhandled');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Promise rejected: ${event.reason}`, 'unhandled');
    };

    // Interceptar console.error
    const originalError = console.error;
    console.error = (...args) => {
      originalError.apply(console, args);
      addLog('error', args.join(' '), 'console.error');
    };

    // Interceptar console.warn
    const originalWarn = console.warn;
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      addLog('warning', args.join(' '), 'console.warn');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isVisible, addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setErrorCount(0);
    setWarningCount(0);
  }, []);

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: DebugLog['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
        {errorCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {errorCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Simple Debug
            </CardTitle>
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {errorCount}
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {warningCount}
                </Badge>
              )}
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                No hay logs aún. Navega por la app para detectar errores.
              </div>
            ) : (
              logs.map((log) => (
                <Alert key={log.id} className={`text-xs ${getLogColor(log.type)}`}>
                  <div className="flex items-start gap-2">
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <AlertDescription className="text-xs">
                        {log.message}
                      </AlertDescription>
                      <div className="text-xs text-gray-500 mt-1">
                        {log.timestamp.toLocaleTimeString()} - {log.source}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDebug; 