-- MIGRACIÓN RÁPIDA PARA SUPABASE
-- Copiar y pegar este script en el SQL Editor de Supabase Dashboard

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- 2. Crear tablas faltantes
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

-- 3. Agregar foreign keys
ALTER TABLE public.family_invitations 
ADD CONSTRAINT IF NOT EXISTS family_invitations_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.family_notifications 
ADD CONSTRAINT IF NOT EXISTS family_notifications_family_id_fkey 
FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- 4. Crear función de actualización
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Crear trigger
DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON public.family_invitations;
CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Crear función de aceptación de invitaciones
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

-- 7. Habilitar RLS nuevamente
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

-- 8. Crear políticas RLS simplificadas
DROP POLICY IF EXISTS "Users can view their own families" ON public.families;
CREATE POLICY "Users can view their own families" 
ON public.families FOR SELECT 
USING (id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families" 
ON public.families FOR INSERT 
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view family members" ON public.family_members;
CREATE POLICY "Users can view family members" 
ON public.family_members FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
CREATE POLICY "Users can join families" 
ON public.family_members FOR INSERT 
WITH CHECK (user_id = auth.uid());

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

DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.family_invitations;
CREATE POLICY "Users can view invitations they sent" 
ON public.family_invitations FOR SELECT 
USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can create invitations" ON public.family_invitations;
CREATE POLICY "Users can create invitations" 
ON public.family_invitations FOR INSERT 
WITH CHECK (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their notifications" ON public.family_notifications;
CREATE POLICY "Users can view their notifications" 
ON public.family_notifications FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.family_notifications;
CREATE POLICY "System can create notifications" 
ON public.family_notifications FOR INSERT 
WITH CHECK (true);

-- 9. Verificar que todo funciona
SELECT 'Migration completed successfully' as status; 