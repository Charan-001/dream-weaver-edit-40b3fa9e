-- Add RLS policies for admins to manage lotteries
CREATE POLICY "Admins can insert lotteries"
ON public.lotteries
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lotteries"
ON public.lotteries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lotteries"
ON public.lotteries
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to manage lottery results
CREATE POLICY "Admins can insert lottery results"
ON public.lottery_results
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lottery results"
ON public.lottery_results
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lottery results"
ON public.lottery_results
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));