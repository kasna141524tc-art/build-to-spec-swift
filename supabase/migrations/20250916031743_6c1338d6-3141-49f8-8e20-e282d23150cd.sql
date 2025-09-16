-- CryptoFlow Journal Database Schema
-- Creating all tables with proper constraints, triggers, and functions

-- Users table for both Traders and Investors
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('trader', 'investor')),
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  avatar_url TEXT,
  trader_uid TEXT UNIQUE, -- Only for traders
  bound_trader_id UUID REFERENCES public.users(id), -- Only for investors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades table for all trade and investment types
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining')),
  asset TEXT NOT NULL,
  price DECIMAL NOT NULL CHECK (price > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  quantity DECIMAL NOT NULL CHECK (quantity > 0),
  trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
  fees DECIMAL CHECK (fees >= 0),
  profit_loss DECIMAL,
  details JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bindings table for Trader-Investor relationships
CREATE TABLE public.bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trader_id, investor_id)
);

-- Audit log for tracking changes
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Trades
CREATE POLICY "Traders can manage their own trades" ON public.trades
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Investors can view bound trader's trades" ON public.trades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bindings b
    WHERE b.investor_id = auth.uid()
    AND b.trader_id = public.trades.user_id
    AND b.status = 'approved'
  )
);

-- RLS Policies for Bindings
CREATE POLICY "Traders can view their bindings" ON public.bindings
FOR SELECT USING (auth.uid() = trader_id);

CREATE POLICY "Investors can view their binding requests" ON public.bindings
FOR SELECT USING (auth.uid() = investor_id);

CREATE POLICY "Investors can create binding requests" ON public.bindings
FOR INSERT WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Traders can update binding status" ON public.bindings
FOR UPDATE USING (auth.uid() = trader_id);

-- RLS Policies for Audit Log
CREATE POLICY "Users can view their own audit logs" ON public.audit_log
FOR SELECT USING (auth.uid() = user_id);

-- Function to generate trader UID
CREATE OR REPLACE FUNCTION public.generate_trader_uid()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    role, 
    username,
    trader_uid
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'trader'),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'trader') = 'trader' 
      THEN public.generate_trader_uid()
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log trade changes
CREATE OR REPLACE FUNCTION public.log_trade_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (trade_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'create', NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (trade_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'update', jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    ));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (trade_id, user_id, action, changes)
    VALUES (OLD.id, OLD.user_id, 'delete', row_to_json(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce investor binding limits
CREATE OR REPLACE FUNCTION public.check_binding_limit()
RETURNS TRIGGER AS $$
DECLARE
  binding_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO binding_count
  FROM public.bindings
  WHERE trader_id = NEW.trader_id AND status = 'approved';
  
  IF binding_count >= 10 THEN
    RAISE EXCEPTION 'Trader has reached the maximum binding limit of 10 investors';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate investment P&L requirement
CREATE OR REPLACE FUNCTION public.validate_investment_pnl()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if it's an investment category that requires P&L
  IF NEW.category IN ('defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining') THEN
    IF NEW.profit_loss IS NULL THEN
      RAISE EXCEPTION 'Profit/Loss is required for investment category: %', NEW.category;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bindings_updated_at
  BEFORE UPDATE ON public.bindings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER audit_trades_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.log_trade_changes();

CREATE TRIGGER check_binding_limit_trigger
  BEFORE INSERT OR UPDATE ON public.bindings
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.check_binding_limit();

CREATE TRIGGER validate_investment_pnl_trigger
  BEFORE INSERT OR UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.validate_investment_pnl();

-- Enable realtime for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bindings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Set up replica identity for realtime
ALTER TABLE public.trades REPLICA IDENTITY FULL;
ALTER TABLE public.bindings REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;