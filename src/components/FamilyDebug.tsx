import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FamilyMember, FamilyInvitation, FamilyNotification } from '@/types/finance';

interface FamilyDebugProps {
  familyId: string | null;
  familyName?: string;
  familyMembers: FamilyMember[];
  familyInvitations: FamilyInvitation[];
  familyNotifications: FamilyNotification[];
  currentUserId: string;
  isAdmin: boolean;
}

const FamilyDebug: React.FC<FamilyDebugProps> = ({
  familyId,
  familyName,
  familyMembers,
  familyInvitations,
  familyNotifications,
  currentUserId,
  isAdmin
}) => {
  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-sm text-orange-800">🔍 Debug - Gestión Familiar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Family ID:</strong> {familyId || 'null'}
          </div>
          <div>
            <strong>Family Name:</strong> {familyName || 'undefined'}
          </div>
          <div>
            <strong>Current User ID:</strong> {currentUserId || 'empty'}
          </div>
          <div>
            <strong>Is Admin:</strong> {isAdmin ? 'true' : 'false'}
          </div>
        </div>
        
        <div className="space-y-1">
          <div>
            <strong>Family Members ({familyMembers?.length || 0}):</strong>
            {familyMembers?.map((member, index) => (
              <div key={member.id} className="ml-2 text-xs">
                {index + 1}. ID: {member.id} | User: {member.user_id} | Role: {member.role} | Email: {member.user_email || 'N/A'}
              </div>
            ))}
          </div>
          
          <div>
            <strong>Family Invitations ({familyInvitations?.length || 0}):</strong>
            {familyInvitations?.map((invitation, index) => (
              <div key={invitation.id} className="ml-2 text-xs">
                {index + 1}. ID: {invitation.id} | Email: {invitation.invited_email} | Status: {invitation.status}
              </div>
            ))}
          </div>
          
          <div>
            <strong>Family Notifications ({familyNotifications?.length || 0}):</strong>
            {familyNotifications?.map((notification, index) => (
              <div key={notification.id} className="ml-2 text-xs">
                {index + 1}. ID: {notification.id} | Type: {notification.type} | Title: {notification.title}
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2">
          <strong>Raw Data Types:</strong>
          <div className="ml-2 text-xs">
            <div>familyMembers type: {typeof familyMembers} - Array: {Array.isArray(familyMembers) ? 'Yes' : 'No'}</div>
            <div>familyInvitations type: {typeof familyInvitations} - Array: {Array.isArray(familyInvitations) ? 'Yes' : 'No'}</div>
            <div>familyNotifications type: {typeof familyNotifications} - Array: {Array.isArray(familyNotifications) ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyDebug; 