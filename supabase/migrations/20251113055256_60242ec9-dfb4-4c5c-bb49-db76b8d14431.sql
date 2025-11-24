-- Create enum for lottery types
CREATE TYPE public.lottery_type AS ENUM ('weekly', 'monthly', 'special', 'bumper');

-- Create enum for lottery status
CREATE TYPE public.lottery_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- Create lotteries table
CREATE TABLE public.lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lottery_type public.lottery_type NOT NULL DEFAULT 'weekly',
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  first_prize DECIMAL(15,2) NOT NULL,
  second_prize DECIMAL(15,2),
  third_prize DECIMAL(15,2),
  status public.lottery_status NOT NULL DEFAULT 'upcoming',
  total_tickets INTEGER NOT NULL DEFAULT 100000,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lottery_results table
CREATE TABLE public.lottery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID REFERENCES public.lotteries(id) ON DELETE CASCADE NOT NULL,
  first_prize_number TEXT NOT NULL,
  second_prize_number TEXT,
  third_prize_number TEXT,
  declared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID REFERENCES public.lotteries(id) ON DELETE CASCADE NOT NULL,
  ticket_number TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_phone TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_winner BOOLEAN DEFAULT FALSE,
  prize_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lottery_id, ticket_number)
);

-- Enable RLS
ALTER TABLE public.lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anyone can view lotteries and results)
CREATE POLICY "Anyone can view lotteries"
  ON public.lotteries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view lottery results"
  ON public.lottery_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view tickets"
  ON public.tickets FOR SELECT
  USING (true);

-- Create policies for insert (anyone can purchase tickets)
CREATE POLICY "Anyone can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lotteries
CREATE TRIGGER update_lotteries_updated_at
  BEFORE UPDATE ON public.lotteries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lotteries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lottery_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Insert some sample data
INSERT INTO public.lotteries (name, lottery_type, draw_date, ticket_price, first_prize, second_prize, third_prize, status, image_url)
VALUES 
  ('Weekly Super Draw', 'weekly', NOW() + INTERVAL '7 days', 50, 1000000, 500000, 100000, 'upcoming', '/lottery-design.png'),
  ('Monthly Mega Draw', 'monthly', NOW() + INTERVAL '30 days', 100, 5000000, 1000000, 500000, 'upcoming', '/lottery-design.png'),
  ('Special Bumper', 'special', NOW() + INTERVAL '15 days', 200, 10000000, 2000000, 1000000, 'upcoming', '/lottery-design.png');