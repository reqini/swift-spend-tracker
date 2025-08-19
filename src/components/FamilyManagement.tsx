import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Share2, Copy, Crown, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FamilyInviteForm from "./FamilyInviteForm";
import FamilyMembers from "./FamilyMembers";
import FamilyNotifications from "./FamilyNotifications";
import { FamilyMember, FamilyInvitation, FamilyNotification } from "@/types/finance";

interface FamilyManagementProps {
  familyId: string | null;
  familyName?: string;
  familyMembers: FamilyMember[];
  familyInvitations: FamilyInvitation[];
  familyNotifications: FamilyNotification[];
  currentUserId: string;
  isAdmin: boolean;
  onCreateFamily: (name: string) => Promise<{ success: boolean; message?: string }>;
  onJoinFamily: (inviteCode: string) => Promise<{ success: boolean; message?: string }>;
  onGetInviteCode: () => Promise<string | null>;
  onSendInvitation: (email: string, message?: string) => Promise<{ success: boolean; message?: string }>;
  onRemoveMember: (memberId: string) => Promise<boolean>;
  onChangeRole: (memberId: string, role: 'admin' | 'member') => Promise<boolean>;
  onNotificationRead: (notificationId: string) => Promise<boolean>;
  onNotificationDelete: (notificationId: string) => Promise<boolean>;
}

const FamilyManagement = ({ 
  familyId, 
  familyName,
  familyMembers,
  familyInvitations,
  familyNotifications,
  currentUserId,
  isAdmin,
  onCreateFamily, 
  onJoinFamily, 
  onGetInviteCode,
  onSendInvitation,
  onRemoveMember,
  onChangeRole,
  onNotificationRead,
  onNotificationDelete
}: FamilyManagementProps) => {
  // Debug logs
  console.log('FamilyManagement Debug:', {
    familyId,
    familyName,
    familyMembers: familyMembers?.length || 0,
    familyInvitations: familyInvitations?.length || 0,
    familyNotifications: familyNotifications?.length || 0,
    currentUserId,
    isAdmin
  });
  const [isOpen, setIsOpen] = useState(false);
  const [createFamilyName, setCreateFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFamilyName?.trim()) return;

    setLoading(true);
    const result = await onCreateFamily(createFamilyName.trim());
    if (result) {
      setCreateFamilyName('');
      setIsOpen(false);
      toast({
        title: "Familia creada",
        description: `La familia "${createFamilyName}" fue creada exitosamente`,
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
      <div className="space-y-3">
        <div className="flex gap-2">
          <FamilyInviteForm
            familyId={familyId}
            familyName={familyName || 'Familia'}
            onInviteSent={() => {
              // Refresh data will be handled by the hook
            }}
            invitations={familyInvitations}
            onInvitationUpdate={() => {
              // This will be handled by the hook
            }}
          />
          <FamilyMembers
            members={familyMembers}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onMemberRemove={onRemoveMember}
            onRoleChange={onChangeRole}
          />
        </div>
        
        <FamilyNotifications
          notifications={familyNotifications}
          onNotificationRead={onNotificationRead}
          onNotificationDelete={onNotificationDelete}
        />
        
        {isAdmin && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Código de Invitación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Código de Invitación</DialogTitle>
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
        )}
      </div>
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
                      value={createFamilyName}
                      onChange={(e) => setCreateFamilyName(e.target.value)}
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