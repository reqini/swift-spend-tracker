import { lazy } from 'react';

// Lazy load components that are not immediately needed
export const FamilyManagement = lazy(() => import('./FamilyManagement'));
export const CategoryChart = lazy(() => import('./CategoryChart'));
export const CategoryStats = lazy(() => import('./CategoryStats'));
export const TransactionFilters = lazy(() => import('./TransactionFilters'));
export const EditTransactionModal = lazy(() => import('./EditTransactionModal'));
export const PWAInstallPrompt = lazy(() => import('./PWAInstallPrompt'));
export const FamilyInviteForm = lazy(() => import('./FamilyInviteForm'));
export const FamilyMembers = lazy(() => import('./FamilyMembers'));
export const FamilyNotifications = lazy(() => import('./FamilyNotifications')); 