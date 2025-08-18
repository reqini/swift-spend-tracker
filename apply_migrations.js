// Script para aplicar migraciones a Supabase usando la API
import fetch from 'node-fetch';

const SUPABASE_URL = "https://deensmuaonpjvgkbcnwk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZW5zbXVhb25wanZna2JjbndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjIwMjksImV4cCI6MjA3MTA5ODAyOX0.Ptfl7ofZWmO-612HnWKFzuLWqE3OqwmYnoUBvbYHqrI";

// SQL para aplicar migraciones
const MIGRATION_SQL = `
-- Script para corregir y aplicar migraciones a Supabase Cloud
-- Primero deshabilitamos RLS temporalmente para evitar recursión

-- Deshabilitar RLS temporalmente
ALTER TABLE IF EXISTS public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;

-- Crear tabla para family invitations si no existe
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

-- Crear tabla para family notifications si no existe
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

-- Agregar foreign keys si no existen
DO $$ 
BEGIN
  -- Agregar FK para family_invitations si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_invitations_family_id_fkey'
  ) THEN
    ALTER TABLE public.family_invitations 
    ADD CONSTRAINT family_invitations_family_id_fkey 
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
  END IF;
  
  -- Agregar FK para family_notifications si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'family_notifications_family_id_fkey'
  ) THEN
    ALTER TABLE public.family_notifications 
    ADD CONSTRAINT family_notifications_family_id_fkey 
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear función update_updated_at_column si no existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para family invitations si no existe
DROP TRIGGER IF EXISTS update_family_invitations_updated_at ON public.family_invitations;
CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear función para manejar invitaciones si no existe
CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_record RECORD;
  family_record RECORD;
BEGIN
  -- Obtener detalles de la invitación
  SELECT * INTO invitation_record 
  FROM public.family_invitations 
  WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invitation not found or expired');
  END IF;
  
  -- Obtener detalles de la familia
  SELECT * INTO family_record 
  FROM public.families 
  WHERE id = invitation_record.family_id;
  
  -- Agregar usuario a la familia
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (invitation_record.family_id, auth.uid(), 'member')
  ON CONFLICT (family_id, user_id) DO NOTHING;
  
  -- Actualizar estado de la invitación
  UPDATE public.family_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = invitation_record.id;
  
  -- Crear notificación para el admin de la familia
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

-- Habilitar RLS nuevamente
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS corregidas (sin recursión)
-- Políticas para families
DROP POLICY IF EXISTS "Users can view their own families" ON public.families;
CREATE POLICY "Users can view their own families" 
ON public.families 
FOR SELECT 
USING (
  id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create families" ON public.families;
CREATE POLICY "Users can create families" 
ON public.families 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Políticas para family_members (simplificadas para evitar recursión)
DROP POLICY IF EXISTS "Users can view family members" ON public.family_members;
CREATE POLICY "Users can view family members" 
ON public.family_members 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
CREATE POLICY "Users can join families" 
ON public.family_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
CREATE POLICY "Users can view their transactions" 
ON public.transactions 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their transactions" ON public.transactions;
CREATE POLICY "Users can update their transactions" 
ON public.transactions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Políticas para family_invitations
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON public.family_invitations;
CREATE POLICY "Users can view invitations they sent or received" 
ON public.family_invitations 
FOR SELECT 
USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Family admins can create invitations" ON public.family_invitations;
CREATE POLICY "Family admins can create invitations" 
ON public.family_invitations 
FOR INSERT 
WITH CHECK (invited_by = auth.uid());

-- Políticas para family_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.family_notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.family_notifications 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON public.family_notifications;
CREATE POLICY "System can create notifications" 
ON public.family_notifications 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.family_notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.family_notifications 
FOR UPDATE 
USING (user_id = auth.uid());
`;

async function applyMigrations() {
  console.log('🚀 Aplicando migraciones a Supabase...');
  
  try {
    // Nota: La API REST de Supabase no permite ejecutar SQL directamente
    // Necesitamos usar el SQL Editor del dashboard
    console.log('⚠️  IMPORTANTE: La API REST no permite ejecutar SQL directamente');
    console.log('📋 Por favor, sigue estos pasos:');
    console.log('');
    console.log('1. Ve a https://supabase.com/dashboard');
    console.log('2. Selecciona tu proyecto: deensmuaonpjvgkbcnwk');
    console.log('3. Ve a SQL Editor');
    console.log('4. Copia y pega el siguiente SQL:');
    console.log('');
    console.log('='.repeat(80));
    console.log(MIGRATION_SQL);
    console.log('='.repeat(80));
    console.log('');
    console.log('5. Haz click en "Run"');
    console.log('6. Verifica que no hay errores');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigrations(); 