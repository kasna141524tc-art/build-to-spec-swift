import { useMemo } from 'react';
import { Trade } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

interface ProfitLossChartProps {
  trades: Trade[];
}

export function ProfitLossChart({ trades }: ProfitLossChartProps) {
  const chartData = useMemo(() => {
    if (trades.length === 0) return [];

    return trades
      .filter(trade => trade.profit_loss !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
      .map(trade => ({
        date: format(new Date(trade.trade_date), 'MMM dd'),
        pnl: trade.profit_loss || 0,
        asset: trade.asset,
        category: trade.category,
      }));
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{data.asset} - {data.category}</p>
          <p className={`font-medium ${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            P&L: ${data.pnl.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    const color = props.payload.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
    return <Bar {...rest} fill={color} />;
  };

  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle>Profit & Loss Analysis</CardTitle>
        <CardDescription>
          Individual trade performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="2 2" />
              <Bar 
                dataKey="pnl" 
                shape={<CustomBar />}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}