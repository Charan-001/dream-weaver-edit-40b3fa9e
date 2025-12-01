-- Fix search_path for update_expired_lotteries function
CREATE OR REPLACE FUNCTION update_expired_lotteries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lotteries
  SET status = 'completed'
  WHERE draw_date < NOW()
  AND status IN ('active', 'upcoming');
END;
$$;