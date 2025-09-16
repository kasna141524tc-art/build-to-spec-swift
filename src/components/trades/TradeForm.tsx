import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade, TradeCategory } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const baseSchema = z.object({
  category: z.enum(['spot', 'futures', 'defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining']),
  asset: z.string().min(1, 'Asset is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  trade_date: z.date(),
  fees: z.number().min(0, 'Fees cannot be negative').optional(),
  notes: z.string().optional(),
});

const investmentSchema = baseSchema.extend({
  profit_loss: z.number().optional(),
});

const spotSchema = baseSchema.extend({
  buy_sell: z.enum(['buy', 'sell']),
});

const futuresSchema = baseSchema.extend({
  buy_sell: z.enum(['buy', 'sell']),
  leverage: z.number().positive().optional(),
  margin: z.number().positive().optional(),
});

const defiSchema = investmentSchema.extend({
  platform: z.string().min(1, 'Platform is required'),
  apy: z.number().min(0).optional(),
});

const dualInvestmentSchema = investmentSchema.extend({
  platform: z.string().min(1, 'Platform is required'),
  strike_price: z.number().positive().optional(),
});

const liquidityPoolSchema = investmentSchema.extend({
  platform: z.string().min(1, 'Platform is required'),
  pool_share: z.number().min(0).max(1).optional(),
});

const liquidityMiningSchema = investmentSchema.extend({
  platform: z.string().min(1, 'Platform is required'),
  rewards_token: z.string().optional(),
});

interface TradeFormProps {
  trade?: Trade;
  onSuccess: () => void;
}

export function TradeForm({ trade, onSuccess }: TradeFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TradeCategory>(
    trade?.category || 'spot'
  );

  const getSchema = (category: TradeCategory) => {
    switch (category) {
      case 'spot':
        return spotSchema;
      case 'futures':
        return futuresSchema;
      case 'defi':
        return defiSchema;
      case 'dual_investment':
        return dualInvestmentSchema;
      case 'liquidity_pool':
        return liquidityPoolSchema;
      case 'liquidity_mining':
        return liquidityMiningSchema;
      default:
        return baseSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema(selectedCategory)),
    defaultValues: {
      category: trade?.category || 'spot',
      asset: trade?.asset || '',
      price: trade?.price || 0,
      quantity: trade?.quantity || 0,
      trade_date: trade?.trade_date ? new Date(trade.trade_date) : new Date(),
      fees: trade?.fees || 0,
      profit_loss: trade?.profit_loss || undefined,
      notes: trade?.notes || '',
      // Details fields
      buy_sell: trade?.details?.buy_sell || 'buy',
      leverage: trade?.details?.leverage || undefined,
      margin: trade?.details?.margin || undefined,
      platform: trade?.details?.platform || '',
      apy: trade?.details?.apy || undefined,
      strike_price: trade?.details?.strike_price || undefined,
      pool_share: trade?.details?.pool_share || undefined,
      rewards_token: trade?.details?.rewards_token || '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!profile) return;

    setLoading(true);
    try {
      // Prepare details object based on category
      let details: any = {};
      
      switch (data.category) {
        case 'spot':
        case 'futures':
          details.buy_sell = data.buy_sell;
          if (data.leverage) details.leverage = data.leverage;
          if (data.margin) details.margin = data.margin;
          break;
        case 'defi':
          details.platform = data.platform;
          if (data.apy) details.apy = data.apy;
          break;
        case 'dual_investment':
          details.platform = data.platform;
          if (data.strike_price) details.strike_price = data.strike_price;
          break;
        case 'liquidity_pool':
          details.platform = data.platform;
          if (data.pool_share) details.pool_share = data.pool_share;
          break;
        case 'liquidity_mining':
          details.platform = data.platform;
          if (data.rewards_token) details.rewards_token = data.rewards_token;
          break;
      }

      const tradeData = {
        user_id: profile.id,
        category: data.category,
        asset: data.asset,
        price: data.price,
        currency: profile.currency,
        quantity: data.quantity,
        trade_date: data.trade_date.toISOString(),
        fees: data.fees || null,
        profit_loss: data.profit_loss || null,
        details,
        notes: data.notes || null,
      };

      let result;
      if (trade?.id) {
        result = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', trade.id);
      } else {
        result = await supabase
          .from('trades')
          .insert([tradeData]);
      }

      if (result.error) throw result.error;

      toast({
        title: trade?.id ? "Trade updated" : "Trade added",
        description: `${data.asset} ${data.category} has been ${trade?.id ? 'updated' : 'added'} successfully.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Trade form error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isInvestmentCategory = ['defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'].includes(selectedCategory);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category Selection */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedCategory(value as TradeCategory);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="spot">Spot Trading</SelectItem>
                  <SelectItem value="futures">Futures Trading</SelectItem>
                  <SelectItem value="defi">DeFi Investment</SelectItem>
                  <SelectItem value="dual_investment">Dual Investment</SelectItem>
                  <SelectItem value="liquidity_pool">Liquidity Pool</SelectItem>
                  <SelectItem value="liquidity_mining">Liquidity Mining</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic Fields */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="asset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., BTC, ETH" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isInvestmentCategory ? 'Initial Investment' : 'Price'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.00000001"
                    placeholder="0.00000000"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trade_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category-specific fields */}
        {(selectedCategory === 'spot' || selectedCategory === 'futures') && (
          <FormField
            control={form.control}
            name="buy_sell"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {selectedCategory === 'futures' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="leverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leverage (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder="e.g., 10"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="margin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Margin (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {isInvestmentCategory && (
          <>
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Aave, Uniswap, Binance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profit_loss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profit/Loss</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00 (positive for profit, negative for loss)"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCategory === 'defi' && (
              <FormField
                control={form.control}
                name="apy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>APY % (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="e.g., 5.25"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedCategory === 'dual_investment' && (
              <FormField
                control={form.control}
                name="strike_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strike Price (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedCategory === 'liquidity_pool' && (
              <FormField
                control={form.control}
                name="pool_share"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pool Share % (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.0001"
                        placeholder="e.g., 0.01 (for 1%)"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedCategory === 'liquidity_mining' && (
              <FormField
                control={form.control}
                name="rewards_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rewards Token (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SUSHI, UNI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fees (optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes about this trade..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : trade?.id ? "Update Trade" : "Add Trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}