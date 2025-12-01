-- Create function to update expired lotteries
CREATE OR REPLACE FUNCTION update_expired_lotteries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.lotteries
  SET status = 'completed'
  WHERE draw_date < NOW()
  AND status IN ('active', 'upcoming');
END;
$$;