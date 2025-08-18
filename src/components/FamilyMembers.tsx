import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Crown, 
  User, 
  Calendar,
  Mail,
  MoreVertical,
  Trash2,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FamilyMember } from "@/types/finance";

interface FamilyMembersProps {
  members: FamilyMember[];
  currentUserId: string;
  isAdmin: boolean;
  onMemberRemove: (memberId: string) => void;
  onRoleChange: (memberId: string, newRole: 'admin' | 'member') => void;
}

const FamilyMembers = ({ 
  members, 
  currentUserId, 
  isAdmin, 
  onMemberRemove, 
  onRoleChange 
}: FamilyMembersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handleRemoveMember = (member: FamilyMember) => {
    if (member.user_id === currentUserId) {
      toast({
        title: "Error",
        description: "No puedes eliminarte a ti mismo",
        variant: "destructive"
      });
      return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar a ${member.user_email || 'este miembro'}?`)) {
      onMemberRemove(member.id);
    }
  };

  const handleRoleChange = (member: FamilyMember) => {
    if (member.user_id === currentUserId) {
      toast({
        title: "Error",
        description: "No puedes cambiar tu propio rol",
        variant: "destructive"
      });
      return;
    }

    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const action = newRole === 'admin' ? 'promover a administrador' : 'quitar administrador';
    
    if (confirm(`¿Estás seguro de que quieres ${action} a ${member.user_email || 'este miembro'}?`)) {
      onRoleChange(member.id, newRole);
    }
  };

  const currentMember = members.find(m => m.user_id === currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Miembros ({members.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Miembros de la Familia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay miembros</p>
              <p className="text-sm">Invita a tu primera familia</p>
            </div>
          ) : (
            members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const canManage = isAdmin && !isCurrentUser;

              return (
                <Card key={member.id} className={isCurrentUser ? 'border-primary/20 bg-primary/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${member.role === 'admin' 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-blue-100 text-blue-600'
                          }
                        `}>
                          {member.role === 'admin' ? (
                            <Crown className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {member.user_email || 'Usuario'}
                              {isCurrentUser && ' (Tú)'}
                            </span>
                            <Badge className={
                              member.role === 'admin' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }>
                              {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Se unió: {formatDate(member.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {canManage && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleChange(member)}
                            className="h-8 w-8 p-0"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyMembers; 