import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Mail, 
  Users, 
  CheckCircle, 
  Plus,
  Clock,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FamilyNotification } from "@/types/finance";

interface FamilyNotificationsProps {
  notifications: FamilyNotification[];
  onNotificationRead: (notificationId: string) => void;
  onNotificationDelete: (notificationId: string) => void;
}

const FamilyNotifications = ({ 
  notifications, 
  onNotificationRead, 
  onNotificationDelete 
}: FamilyNotificationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invitation_sent':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'invitation_accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'member_joined':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'transaction_added':
        return <Plus className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'invitation_sent':
        return 'bg-blue-100 text-blue-800';
      case 'invitation_accepted':
        return 'bg-green-100 text-green-800';
      case 'member_joined':
        return 'bg-purple-100 text-purple-800';
      case 'transaction_added':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarkAsRead = (notification: FamilyNotification) => {
    if (!notification.read_at) {
      onNotificationRead(notification.id);
    }
  };

  const handleDelete = (notification: FamilyNotification) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      onNotificationDelete(notification.id);
    }
  };

  const markAllAsRead = () => {
    notifications
      .filter(n => !n.read_at)
      .forEach(n => onNotificationRead(n.id));
    
    toast({
      title: "Notificaciones marcadas como leídas",
      description: "Todas las notificaciones han sido marcadas como leídas",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full relative">
          <Bell className="h-4 w-4 mr-2" />
          Notificaciones
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Notificaciones Familiares</DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay notificaciones</p>
              <p className="text-sm">Las notificaciones aparecerán aquí</p>
            </div>
          ) : (
            notifications
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.read_at ? 'border-primary/20 bg-primary/5' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {notification.title}
                            </span>
                            <Badge className={getNotificationColor(notification.type)}>
                              {notification.type.replace('_', ' ')}
                            </Badge>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(notification.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyNotifications; 