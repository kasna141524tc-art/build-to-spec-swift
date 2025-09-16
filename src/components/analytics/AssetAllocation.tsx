import { useMemo } from 'react';
import { Trade } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AssetAllocationProps {
  trades: Trade[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--coral))',
  'hsl(var(--blue-accent))',
  'hsl(var(--success))',
  'hsl(var(--destructive))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
];

export function AssetAllocation({ trades }: AssetAllocationProps) {
  const allocationData = useMemo(() => {
    if (trades.length === 0) return [];

    const assetValues = trades.reduce((acc, trade) => {
      const value = trade.price * trade.quantity;
      if (!acc[trade.asset]) {
        acc[trade.asset] = 0;
      }
      acc[trade.asset] += value;
      return acc;
    }, {} as Record<string, number>);

    const totalValue = Object.values(assetValues).reduce((sum, value) => sum + value, 0);

    return Object.entries(assetValues)
      .map(([asset, value]) => ({
        name: asset,
        value,
        percentage: ((value / totalValue) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 assets
  }, [trades]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">
            Value: ${data.value.toLocaleString()}
          </p>
          <p className="text-muted-foreground">
            {data.percentage}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (parseFloat(percentage) < 5) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage}%`}
      </text>
    );
  };

  if (allocationData.length === 0) {
    return (
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>Portfolio distribution by asset</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <CardDescription>
          Portfolio distribution by asset value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value} ({entry.payload.percentage}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}