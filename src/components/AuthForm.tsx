import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, UserPlus, Wallet, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      toast({
        title: "¡Registro exitoso!",
        description: "Revisa tu email para confirmar tu cuenta. Si no recibes el email, verifica tu carpeta de spam.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingresa tu email para recuperar la contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Revisa tu email para restablecer tu contraseña. Si no lo recibes, verifica tu carpeta de spam.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setError('');
  };

  // Mostrar formulario de recuperación de contraseña
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Wallet className="h-8 w-8" />
              Mis Finanzas Rápidas
            </h1>
            <p className="text-muted-foreground">
              Recuperar contraseña
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Recuperar Contraseña
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                  <h3 className="text-lg font-semibold">Email Enviado</h3>
                  <p className="text-muted-foreground">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revisa tu email y haz clic en el enlace para cambiar tu contraseña.
                    Si no recibes el email, verifica tu carpeta de spam.
                  </p>
                  <Button 
                    onClick={resetForgotPassword}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-muted-foreground">
                      Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForgotPassword}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={loading || !email}
                    >
                      {loading ? "Enviando..." : "Enviar Email"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Wallet className="h-8 w-8" />
            Mis Finanzas Rápidas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus finanzas familiares
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acceder a tu cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading || !email}
                  className="text-sm"
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Registrarse
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;