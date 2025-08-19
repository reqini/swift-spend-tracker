-- MIGRACIÓN COMPLETA PARA SUPABASE
-- Incluye: Corrección de RLS, tablas faltantes, y nuevas funcionalidades
-- Copiar y pegar este script en el SQL Editor de Supabase Dashboard

-- ========================================
-- PASO 1: DESHABILITAR RLS TEMPORALMENTE
-- ========================================
ALTER TABLE IF EXISTS public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 2: CREAR TABLAS FALTANTES
-- ========================================

-- Tabla de invitaciones de familia
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, invited_email)
);

-- Tabla de notificaciones de familia
CREATE TABLE IF NOT EXISTS public.family_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invitation_sent', 'invitation_accepted', 'member_joined', 'transaction_added')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de alertas de presupuesto
CREATE TABLE IF NOT EXISTS public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warning', 'critical')),
  threshold INTEGER NOT NULL CHECK (threshold > 0 AND threshold <= 100),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- PASO 3: AGREGAR FOREIGN KEYS
-- ========================================

-- Foreign keys para family_invitations
ALTER TABLE public.family_invitations 
ADD CONSTRAINT IF NOT EXISTS family_invitations_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- Foreign keys para family_notifications
ALTER TABLE public.family_notifications 
ADD CONSTRAINT IF NOT EXISTS family_notifications_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- Foreign keys para budgets
ALTER TABLE public.budgets 
ADD CONSTRAINT IF NOT EXISTS budgets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.budgets 
ADD CONSTRAINT IF NOT EXISTS budgets_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- Foreign keys para budget_alerts
ALTER TABLE public.budget_alerts 
ADD CONSTRAINT IF NOT EXISTS budget_alerts_budget_id_fkey 
FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE;

-- ========================================
-- PASO 4: CREAR FUNCIONES Y TRIGGERS
-- ========================================

-- Función de actualización de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para family_invitations
DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON public.family_invitations;
CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para budgets
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función de aceptación de invitaciones
CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_record RECORD;
  family_record RECORD;
BEGIN
  SELECT * INTO invitation_record 
  FROM public.family_invitations 
  WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invitation not found or expired');
  END IF;
  
  SELECT * INTO family_record 
  FROM public.families 
  WHERE id = invitation_record.family_id;
  
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (invitation_record.family_id, auth.uid(), 'member')
  ON CONFLICT (family_id, user_id) DO NOTHING;
  
  UPDATE public.family_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = invitation_record.id;
  
  INSERT INTO public.family_notifications (family_id, user_id, type, title, message, data)
  VALUES (
    invitation_record.family_id,
    invitation_record.invited_by,
    'invitation_accepted',
    'Invitación Aceptada',
    'Tu invitación fue aceptada',
    json_build_object('invited_email', invitation_record.invited_email)
  );
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Successfully joined family',
    'family_name', family_record.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PASO 5: HABILITAR RLS NUEVAMENTE
-- ========================================
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PASO 6: CREAR POLÍTICAS RLS CORREGIDAS
-- ========================================

-- Políticas para families
DROP POLICY IF EXISTS "Users can view their own families" ON public.families;
CREATE POLICY "Users can view their own families" 
ON public.families FOR SELECT 
USING (id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Políticas para family_members (CORREGIDAS)
DROP POLICY IF EXISTS "Users can view family members" ON public.family_members;
CREATE POLICY "Users can view family members" 
ON public.family_members FOR SELECT 
USING (family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
CREATE POLICY "Users can join families" 
ON public.family_members FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
CREATE POLICY "Users can view their transactions" 
ON public.transactions FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their transactions" ON public.transactions;
CREATE POLICY "Users can update their transactions" 
ON public.transactions FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their transactions" ON public.transactions;
CREATE POLICY "Users can delete their transactions" 
ON public.transactions FOR DELETE 
USING (user_id = auth.uid());

-- Políticas para family_invitations
DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.family_invitations;
CREATE POLICY "Users can view invitations they sent" 
ON public.family_invitations FOR SELECT 
USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can create invitations" ON public.family_invitations;
CREATE POLICY "Users can create invitations" 
ON public.family_invitations FOR INSERT 
WITH CHECK (invited_by = auth.uid());

-- Políticas para family_notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.family_notifications;
CREATE POLICY "Users can view their notifications" 
ON public.family_notifications FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.family_notifications;
CREATE POLICY "System can create notifications" 
ON public.family_notifications FOR INSERT 
WITH CHECK (true);

-- Políticas para budgets
DROP POLICY IF EXISTS "Users can view their budgets" ON public.budgets;
CREATE POLICY "Users can view their budgets" 
ON public.budgets FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create budgets" ON public.budgets;
CREATE POLICY "Users can create budgets" 
ON public.budgets FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their budgets" ON public.budgets;
CREATE POLICY "Users can update their budgets" 
ON public.budgets FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their budgets" ON public.budgets;
CREATE POLICY "Users can delete their budgets" 
ON public.budgets FOR DELETE 
USING (user_id = auth.uid());

-- Políticas para budget_alerts
DROP POLICY IF EXISTS "Users can view their budget alerts" ON public.budget_alerts;
CREATE POLICY "Users can view their budget alerts" 
ON public.budget_alerts FOR SELECT 
USING (budget_id IN (SELECT id FROM public.budgets WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "System can create budget alerts" ON public.budget_alerts;
CREATE POLICY "System can create budget alerts" 
ON public.budget_alerts FOR INSERT 
WITH CHECK (true);

-- ========================================
-- PASO 7: CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para family_invitations
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON public.family_invitations(token);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON public.family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON public.family_invitations(status);

-- Índices para family_notifications
CREATE INDEX IF NOT EXISTS idx_family_notifications_user_id ON public.family_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_family_notifications_created_at ON public.family_notifications(created_at);

-- Índices para budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category);
CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON public.budgets(is_active);

-- Índices para budget_alerts
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON public.budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_is_active ON public.budget_alerts(is_active);

-- ========================================
-- PASO 8: VERIFICACIÓN FINAL
-- ========================================

-- Verificar que todas las tablas existen
SELECT 'Migration completed successfully' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('families', 'family_members', 'family_invitations', 'family_notifications', 'transactions', 'budgets', 'budget_alerts')) as tables_created,
       (SELECT COUNT(*) FROM information_schema.policies WHERE table_schema = 'public') as policies_created; 