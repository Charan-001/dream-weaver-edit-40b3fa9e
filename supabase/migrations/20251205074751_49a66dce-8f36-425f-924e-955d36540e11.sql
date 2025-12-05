-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can create their own withdrawal requests
CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update withdrawals (approve/reject)
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for withdrawals
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;