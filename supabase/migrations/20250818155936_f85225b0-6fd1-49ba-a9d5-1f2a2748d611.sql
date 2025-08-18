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

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

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