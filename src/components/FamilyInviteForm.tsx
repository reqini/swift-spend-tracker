import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Plus, 
  Share2, 
  Copy, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  UserPlus,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FamilyInvitation } from "@/types/finance";

interface FamilyInviteFormProps {
  familyId: string;
  familyName: string;
  onInviteSent: () => void;
  invitations: FamilyInvitation[];
  onInvitationUpdate: (invitationId: string, status: 'accepted' | 'declined' | 'expired') => void;
}

const FamilyInviteForm = ({ 
  familyId, 
  familyName, 
  onInviteSent,
  invitations,
  onInvitationUpdate
}: FamilyInviteFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('invite');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/family/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyId,
          email: email.trim(),
          message: message.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Invitación enviada",
          description: `Se envió una invitación a ${email}`,
        });
        setEmail('');
        setMessage('');
        setIsOpen(false);
        onInviteSent();
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo enviar la invitación",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Enlace copiado",
      description: "El enlace de invitación fue copiado al portapapeles",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'declined':
        return 'Rechazada';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const otherInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar Familiar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión de Invitaciones - {familyName}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Nueva Invitación</TabsTrigger>
            <TabsTrigger value="list">Invitaciones ({invitations.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5" />
                  Invitar por Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email del familiar</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="familiar@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="¡Te invito a unirte a nuestra familia para compartir gastos!"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Invitación'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4">
            {invitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay invitaciones</p>
                <p className="text-sm">Envía tu primera invitación</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Pendientes</h4>
                    {pendingInvitations.map((invitation) => (
                      <Card key={invitation.id} className="mb-2">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(invitation.status)}
                                <span className="font-medium">{invitation.invited_email}</span>
                                <Badge className={getStatusColor(invitation.status)}>
                                  {getStatusText(invitation.status)}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Enviada: {formatDate(invitation.created_at)}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteLink(invitation.token)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {otherInvitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Historial</h4>
                    {otherInvitations.map((invitation) => (
                      <Card key={invitation.id} className="mb-2">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(invitation.status)}
                                <span className="font-medium">{invitation.invited_email}</span>
                                <Badge className={getStatusColor(invitation.status)}>
                                  {getStatusText(invitation.status)}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(invitation.updated_at)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyInviteForm; 