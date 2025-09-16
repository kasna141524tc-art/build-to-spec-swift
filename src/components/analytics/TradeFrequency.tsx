import { useMemo } from 'react';
import { Trade } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from 'date-fns';

interface TradeFrequencyProps {
  trades: Trade[];
}

export function TradeFrequency({ trades }: TradeFrequencyProps) {
  const frequencyData = useMemo(() => {
    if (trades.length === 0) return [];

    // Get date range
    const dates = trades.map(trade => new Date(trade.trade_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Generate weeks
    const weeks = eachWeekOfInterval({ start: minDate, end: maxDate });

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const weekTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.trade_date);
        return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
      });

      // Count by category
      const categoryCount = weekTrades.reduce((acc, trade) => {
        acc[trade.category] = (acc[trade.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        week: format(weekStart, 'MMM dd'),
        total: weekTrades.length,
        spot: categoryCount.spot || 0,
        futures: categoryCount.futures || 0,
        defi: categoryCount.defi || 0,
        dual_investment: categoryCount.dual_investment || 0,
        liquidity_pool: categoryCount.liquidity_pool || 0,
        liquidity_mining: categoryCount.liquidity_mining || 0,
      };
    }).slice(-12); // Last 12 weeks
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">Week of {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value} trades
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle>Trading Activity</CardTitle>
        <CardDescription>
          Weekly trading frequency by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={frequencyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="spot" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="futures" stackId="a" fill="hsl(var(--coral))" />
              <Bar dataKey="defi" stackId="a" fill="hsl(var(--blue-accent))" />
              <Bar dataKey="dual_investment" stackId="a" fill="hsl(var(--success))" />
              <Bar dataKey="liquidity_pool" stackId="a" fill="hsl(var(--destructive))" />
              <Bar dataKey="liquidity_mining" stackId="a" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}