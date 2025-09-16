/*
  # Fix RLS Policies for Trade CRUD and Investor-Trader Binding

  1. Fix RLS Policies
    - Correct investor access to trader's trades
    - Fix binding policies
    - Add missing policies for user profile access
  
  2. Security
    - Ensure proper access control
    - Fix investor binding flow
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "investor_access" ON public.trades;
DROP POLICY IF EXISTS "Investors can view bound trader's trades" ON public.trades;

-- Fix the investor access policy for trades
CREATE POLICY "Investors can view approved trader trades" ON public.trades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bindings b
    WHERE b.investor_id = auth.uid()
    AND b.trader_id = public.trades.user_id
    AND b.status = 'approved'
  )
);

-- Add policy for investors to read trader profiles (for binding)
CREATE POLICY "Investors can read trader profiles for binding" ON public.users
FOR SELECT USING (
  role = 'trader' OR auth.uid() = id
);

-- Fix binding policies - allow investors to see their own bindings
DROP POLICY IF EXISTS "Investors can view their binding requests" ON public.bindings;
CREATE POLICY "Investors can view their own bindings" ON public.bindings
FOR SELECT USING (auth.uid() = investor_id);

-- Allow traders to see bindings where they are the trader
DROP POLICY IF EXISTS "Traders can view their bindings" ON public.bindings;
CREATE POLICY "Traders can view their investor bindings" ON public.bindings
FOR SELECT USING (auth.uid() = trader_id);

-- Fix the user profile update trigger to refresh profiles properly
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- If this is an investor being bound to a trader, update their bound_trader_id
  IF NEW.role = 'investor' AND OLD.bound_trader_id IS DISTINCT FROM NEW.bound_trader_id THEN
    -- Additional validation can be added here if needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS handle_profile_update_trigger ON public.users;
CREATE TRIGGER handle_profile_update_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update();

-- Fix the binding approval process
CREATE OR REPLACE FUNCTION public.handle_binding_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a binding is approved, update the investor's bound_trader_id
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.users 
    SET bound_trader_id = NEW.trader_id
    WHERE id = NEW.investor_id;
  END IF;
  
  -- When a binding is revoked, remove the investor's bound_trader_id
  IF NEW.status = 'revoked' AND OLD.status = 'approved' THEN
    UPDATE public.users 
    SET bound_trader_id = NULL
    WHERE id = NEW.investor_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for binding status changes
DROP TRIGGER IF EXISTS handle_binding_approval_trigger ON public.bindings;
CREATE TRIGGER handle_binding_approval_trigger
  AFTER UPDATE ON public.bindings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_binding_approval();

-- Ensure realtime is properly configured
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bindings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;