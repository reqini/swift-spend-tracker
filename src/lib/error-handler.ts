// Sistema centralizado de manejo de errores
import { toast } from '@/hooks/use-toast';

export interface AppError {
  code?: string;
  message: string;
  details?: string;
  severity: 'error' | 'warning' | 'info';
  context?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private constructor() {}
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Manejar errores de Supabase
  handleSupabaseError(error: unknown, context: string): AppError {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    // Mapear errores comunes de Supabase
    if (errorMessage.includes('infinite recursion detected')) {
      return {
        code: 'RLS_RECURSION',
        message: 'Error de configuración de base de datos',
        details: 'Las políticas de seguridad tienen un problema de recursión',
        severity: 'error',
        context
      };
    }
    
    if (errorMessage.includes('Could not find the table')) {
      return {
        code: 'TABLE_NOT_FOUND',
        message: 'Tabla no encontrada',
        details: 'La tabla requerida no existe en la base de datos',
        severity: 'error',
        context
      };
    }
    
    if (errorMessage.includes('Invalid login credentials')) {
      return {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
        details: 'El email o contraseña son incorrectos',
        severity: 'error',
        context
      };
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return {
        code: 'AUTH_EMAIL_NOT_CONFIRMED',
        message: 'Email no confirmado',
        details: 'Por favor verifica tu email antes de continuar',
        severity: 'warning',
        context
      };
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Error inesperado',
      details: errorMessage,
      severity: 'error',
      context
    };
  }

  // Manejar errores de red
  handleNetworkError(error: unknown, context: string): AppError {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    if (errorMessage.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión',
        details: 'No se pudo conectar con el servidor',
        severity: 'error',
        context
      };
    }
    
    return {
      code: 'NETWORK_UNKNOWN',
      message: 'Error de red',
      details: errorMessage,
      severity: 'error',
      context
    };
  }

  // Manejar errores de validación
  handleValidationError(error: unknown, context: string): AppError {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return {
      code: 'VALIDATION_ERROR',
      message: 'Datos inválidos',
      details: errorMessage,
      severity: 'warning',
      context
    };
  }

  // Mostrar error al usuario
  showError(appError: AppError): void {
    console.error(`[${appError.context}] ${appError.code}: ${appError.message}`, appError.details);
    
    toast({
      title: appError.message,
      description: appError.details,
      variant: appError.severity === 'error' ? 'destructive' : 'default'
    });
  }

  // Manejar error genérico
  handleError(error: unknown, context: string): void {
    let appError: AppError;
    
    if (error instanceof Error) {
      // Determinar tipo de error basado en el mensaje
      if (error.message.includes('supabase') || error.message.includes('RLS')) {
        appError = this.handleSupabaseError(error, context);
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        appError = this.handleNetworkError(error, context);
      } else {
        appError = this.handleValidationError(error, context);
      }
    } else {
      appError = {
        code: 'UNKNOWN_ERROR',
        message: 'Error inesperado',
        details: String(error),
        severity: 'error',
        context
      };
    }
    
    this.showError(appError);
  }

  // Log de errores para debugging
  logError(error: unknown, context: string, additionalInfo?: Record<string, unknown>): void {
    console.group(`🚨 Error en ${context}`);
    console.error('Error:', error);
    if (additionalInfo) {
      console.error('Información adicional:', additionalInfo);
    }
    console.trace('Stack trace:');
    console.groupEnd();
  }
}

// Instancia global
export const errorHandler = ErrorHandler.getInstance();

// Hooks de conveniencia
export const useErrorHandler = () => {
  return {
    handleError: (error: unknown, context: string) => errorHandler.handleError(error, context),
    handleSupabaseError: (error: unknown, context: string) => {
      const appError = errorHandler.handleSupabaseError(error, context);
      errorHandler.showError(appError);
    },
    logError: (error: unknown, context: string, additionalInfo?: Record<string, unknown>) => {
      errorHandler.logError(error, context, additionalInfo);
    }
  };
}; 