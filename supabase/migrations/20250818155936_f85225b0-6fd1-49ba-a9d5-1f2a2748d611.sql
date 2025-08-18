-- Create table for storing transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for family groups
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for family members
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Create table for family invitations
CREATE TABLE public.family_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, invited_email)
);

-- Create table for family notifications
CREATE TABLE public.family_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invitation_sent', 'invitation_accepted', 'member_joined', 'transaction_added')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own or family transactions" 
ON public.transactions 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  family_id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
USING (user_id = auth.uid());

-- Create RLS policies for families
CREATE POLICY "Users can view families they belong to" 
ON public.families 
FOR SELECT 
USING (
  id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create families" 
ON public.families 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Family admins can update families" 
ON public.families 
FOR UPDATE 
USING (
  id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for family members
CREATE POLICY "Users can view family members of their families" 
ON public.family_members 
FOR SELECT 
USING (
  family_id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Family admins can manage members" 
ON public.family_members 
FOR ALL 
USING (
  family_id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can join families" 
ON public.family_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for family invitations
CREATE POLICY "Users can view invitations they sent or received" 
ON public.family_invitations 
FOR SELECT 
USING (
  invited_by = auth.uid() OR 
  invited_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Family admins can create invitations" 
ON public.family_invitations 
FOR INSERT 
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.family_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own invitations" 
ON public.family_invitations 
FOR UPDATE 
USING (
  invited_by = auth.uid() OR 
  invited_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Create RLS policies for family notifications
CREATE POLICY "Users can view their own notifications" 
ON public.family_notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.family_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.family_notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_family_invitation(invitation_token TEXT)
RETURNS JSON AS $$
DECLARE
  invitation_record RECORD;
  family_record RECORD;
  result JSON;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record 
  FROM public.family_invitations 
  WHERE token = invitation_token 
    AND status = 'pending' 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invitation not found or expired');
  END IF;
  
  -- Get family details
  SELECT * INTO family_record 
  FROM public.families 
  WHERE id = invitation_record.family_id;
  
  -- Add user to family
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (invitation_record.family_id, auth.uid(), 'member')
  ON CONFLICT (family_id, user_id) DO NOTHING;
  
  -- Update invitation status
  UPDATE public.family_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = invitation_record.id;
  
  -- Create notification for family admin
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