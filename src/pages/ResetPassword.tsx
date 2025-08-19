import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Verificar que tenemos los parámetros necesarios
    if (!token || type !== 'recovery') {
      setError('Enlace de recuperación inválido o expirado');
    }
  }, [token, type]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`Mínimo ${minLength} caracteres`);
    if (!hasUpperCase) errors.push('Al menos una mayúscula');
    if (!hasLowerCase) errors.push('Al menos una minúscula');
    if (!hasNumbers) errors.push('Al menos un número');
    if (!hasSpecialChar) errors.push('Al menos un carácter especial');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token de recuperación no válido');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(`Contraseña débil: ${validation.errors.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cambiar la contraseña: ${errorMessage}`);
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Contraseña Actualizada!
              </h2>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login en unos segundos...
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Ir al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || type !== 'recovery') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enlace Inválido
              </h2>
              <p className="text-gray-600 mb-6">
                Este enlace de recuperación no es válido o ha expirado.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Cambiar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para recuperar tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium">La contraseña debe contener:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Mínimo 8 caracteres</li>
                <li>Al menos una mayúscula</li>
                <li>Al menos una minúscula</li>
                <li>Al menos un número</li>
                <li>Al menos un carácter especial</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando contraseña...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Cancelar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 