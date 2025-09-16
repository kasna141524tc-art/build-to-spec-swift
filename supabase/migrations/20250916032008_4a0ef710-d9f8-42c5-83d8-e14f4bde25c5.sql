-- Fix security warnings by updating functions with proper search paths
-- No need to drop since CREATE OR REPLACE will handle it

CREATE OR REPLACE FUNCTION public.generate_trader_uid()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_trade_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_binding_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_investment_pnl()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if it's an investment category that requires P&L
  IF NEW.category IN ('defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining') THEN
    IF NEW.profit_loss IS NULL THEN
      RAISE EXCEPTION 'Profit/Loss is required for investment category: %', NEW.category;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;