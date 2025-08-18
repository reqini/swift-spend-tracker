import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FamilyManagementProps {
  familyId: string | null;
  onCreateFamily: (name: string) => Promise<any>;
  onJoinFamily: (inviteCode: string) => Promise<any>;
  onGetInviteCode: () => Promise<string | null>;
}

const FamilyManagement = ({ 
  familyId, 
  onCreateFamily, 
  onJoinFamily, 
  onGetInviteCode 
}: FamilyManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    setLoading(true);
    const result = await onCreateFamily(familyName.trim());
    if (result) {
      setFamilyName('');
      setIsOpen(false);
      toast({
        title: "Familia creada",
        description: `La familia "${familyName}" fue creada exitosamente`,
      });
    }
    setLoading(false);
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    const result = await onJoinFamily(inviteCode.trim());
    if (result) {
      setInviteCode('');
      setIsOpen(false);
      toast({
        title: "¡Te uniste a la familia!",
        description: "Ahora puedes ver las finanzas familiares",
      });
    }
    setLoading(false);
  };

  const handleShowInviteCode = async () => {
    setLoading(true);
    const code = await onGetInviteCode();
    if (code) {
      setShowInviteCode(code);
    }
    setLoading(false);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(showInviteCode);
    toast({
      title: "Código copiado",
      description: "El código de invitación fue copiado al portapapeles",
    });
  };

  if (familyId) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Invitar Familiar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Familiar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!showInviteCode ? (
              <Button 
                onClick={handleShowInviteCode} 
                className="w-full"
                disabled={loading}
              >
                Mostrar Código de Invitación
              </Button>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <Label>Código de Invitación</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value={showInviteCode} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={copyInviteCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comparte este código con tu familiar para que pueda unirse
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Gestión Familiar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gestión Familiar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Crear Familia</TabsTrigger>
            <TabsTrigger value="join">Unirse a Familia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5" />
                  Crear Nueva Familia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateFamily} className="space-y-4">
                  <div>
                    <Label htmlFor="familyName">Nombre de la Familia</Label>
                    <Input
                      id="familyName"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="Ej: Familia García"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Crear Familia
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="join" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Unirse a Familia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinFamily} className="space-y-4">
                  <div>
                    <Label htmlFor="inviteCode">Código de Invitación</Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Ingresa el código recibido"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Unirse a Familia
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyManagement;