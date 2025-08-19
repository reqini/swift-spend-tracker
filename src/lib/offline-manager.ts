// Sistema de gestión offline para PWA
import { cacheManager } from './cache-manager';
import { analytics } from './analytics';

interface OfflineAction {
  id: string;
  type: 'CREATE_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION' | 'CREATE_FAMILY' | 'JOIN_FAMILY';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private pendingActions: OfflineAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor() {
    this.loadPendingActions();
    this.setupEventListeners();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  // Configurar event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingActions();
      analytics.track('app_online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      analytics.track('app_offline');
    });

    // Sincronizar cuando la app vuelve a estar activa
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  // Verificar estado de conectividad
  isAppOnline(): boolean {
    return this.isOnline;
  }

  // Agregar acción pendiente
  addPendingAction(type: OfflineAction['type'], data: unknown): string {
    const action: OfflineAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.pendingActions.push(action);
    this.savePendingActions();
    
    analytics.track('offline_action_added', { type, actionId: action.id });
    
    return action.id;
  }

  // Obtener acciones pendientes
  getPendingActions(): OfflineAction[] {
    return [...this.pendingActions];
  }

  // Sincronizar acciones pendientes
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingActions.length === 0) {
      return;
    }

    this.syncInProgress = true;
    analytics.track('offline_sync_started', { pendingCount: this.pendingActions.length });

    try {
      const actionsToProcess = [...this.pendingActions];
      
      for (const action of actionsToProcess) {
        try {
          await this.processAction(action);
          this.removePendingAction(action.id);
        } catch (error) {
          action.retryCount++;
          
          if (action.retryCount >= 3) {
            // Marcar como fallida después de 3 intentos
            this.markActionAsFailed(action.id, error);
          }
        }
      }

      analytics.track('offline_sync_completed', { 
        processed: actionsToProcess.length,
        failed: this.pendingActions.filter(a => a.retryCount >= 3).length
      });

    } catch (error) {
      analytics.trackError(error, 'offline_sync');
    } finally {
      this.syncInProgress = false;
    }
  }

  // Procesar acción individual
  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'CREATE_TRANSACTION':
        await this.processCreateTransaction(action.data as any);
        break;
      case 'UPDATE_TRANSACTION':
        await this.processUpdateTransaction(action.data as any);
        break;
      case 'DELETE_TRANSACTION':
        await this.processDeleteTransaction(action.data as any);
        break;
      case 'CREATE_FAMILY':
        await this.processCreateFamily(action.data as any);
        break;
      case 'JOIN_FAMILY':
        await this.processJoinFamily(action.data as any);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Procesar creación de transacción
  private async processCreateTransaction(data: any): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('transactions')
      .insert(data);

    if (error) throw error;
  }

  // Procesar actualización de transacción
  private async processUpdateTransaction(data: any): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { id, ...updateData } = data;
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // Procesar eliminación de transacción
  private async processDeleteTransaction(data: any): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', data.id);

    if (error) throw error;
  }

  // Procesar creación de familia
  private async processCreateFamily(data: any): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('families')
      .insert(data);

    if (error) throw error;
  }

  // Procesar unión a familia
  private async processJoinFamily(data: any): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from('family_members')
      .insert(data);

    if (error) throw error;
  }

  // Remover acción pendiente
  private removePendingAction(actionId: string): void {
    this.pendingActions = this.pendingActions.filter(action => action.id !== actionId);
    this.savePendingActions();
  }

  // Marcar acción como fallida
  private markActionAsFailed(actionId: string, error: unknown): void {
    const action = this.pendingActions.find(a => a.id === actionId);
    if (action) {
      action.retryCount = 999; // Marcar como fallida permanentemente
      this.savePendingActions();
      
      analytics.trackError(error, `offline_action_failed_${action.type}`);
    }
  }

  // Generar ID único para acción
  private generateActionId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Guardar acciones pendientes en localStorage
  private savePendingActions(): void {
    try {
      localStorage.setItem('offline_pending_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Cargar acciones pendientes desde localStorage
  private loadPendingActions(): void {
    try {
      const stored = localStorage.getItem('offline_pending_actions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
      this.pendingActions = [];
    }
  }

  // Limpiar acciones fallidas
  clearFailedActions(): void {
    this.pendingActions = this.pendingActions.filter(action => action.retryCount < 999);
    this.savePendingActions();
  }

  // Obtener estadísticas
  getStats(): {
    pendingCount: number;
    failedCount: number;
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      pendingCount: this.pendingActions.length,
      failedCount: this.pendingActions.filter(a => a.retryCount >= 999).length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }
}

// Instancia global
export const offlineManager = OfflineManager.getInstance();

// Hooks de conveniencia
export const useOffline = () => {
  return {
    isOnline: () => offlineManager.isAppOnline(),
    addPendingAction: (type: OfflineAction['type'], data: unknown) => 
      offlineManager.addPendingAction(type, data),
    getPendingActions: () => offlineManager.getPendingActions(),
    syncPendingActions: () => offlineManager.syncPendingActions(),
    clearFailedActions: () => offlineManager.clearFailedActions(),
    getStats: () => offlineManager.getStats(),
  };
}; 