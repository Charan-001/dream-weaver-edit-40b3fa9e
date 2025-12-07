-- Add foreign key relationship between withdrawals and profiles
ALTER TABLE public.withdrawals
ADD CONSTRAINT withdrawals_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;