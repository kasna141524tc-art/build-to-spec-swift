import { useMemo } from 'react';
import { Trade } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

interface PerformanceMetricsProps {
  trades: Trade[];
}

export function PerformanceMetrics({ trades }: PerformanceMetricsProps) {
  const metrics = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalPnL: 0,
        winRate: 0,
        profitableTrades: 0,
        totalTrades: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
      };
    }

    const tradesWithPnL = trades.filter(trade => trade.profit_loss !== null);
    const profitableTrades = tradesWithPnL.filter(trade => (trade.profit_loss || 0) > 0);
    const losingTrades = tradesWithPnL.filter(trade => (trade.profit_loss || 0) < 0);

    const totalPnL = tradesWithPnL.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    const totalProfit = profitableTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0));

    const winRate = tradesWithPnL.length > 0 ? (profitableTrades.length / tradesWithPnL.length) * 100 : 0;
    const avgProfit = profitableTrades.length > 0 ? totalProfit / profitableTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const bestTrade = Math.max(...tradesWithPnL.map(trade => trade.profit_loss || 0));
    const worstTrade = Math.min(...tradesWithPnL.map(trade => trade.profit_loss || 0));

    return {
      totalPnL,
      winRate,
      profitableTrades: profitableTrades.length,
      totalTrades: tradesWithPnL.length,
      avgProfit,
      avgLoss,
      profitFactor,
      bestTrade,
      worstTrade,
    };
  }, [trades]);

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = "text-foreground",
    progress 
  }: any) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
      </div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );

  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          Detailed trading performance analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <MetricCard
            title="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            subtitle={`${metrics.profitableTrades} of ${metrics.totalTrades} trades`}
            icon={Target}
            color={metrics.winRate >= 50 ? "text-success" : "text-destructive"}
            progress={metrics.winRate}
          />

          <MetricCard
            title="Profit Factor"
            value={metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
            subtitle="Gross profit / Gross loss"
            icon={TrendingUp}
            color={metrics.profitFactor >= 1 ? "text-success" : "text-destructive"}
          />

          <MetricCard
            title="Average Profit"
            value={`$${metrics.avgProfit.toLocaleString()}`}
            subtitle="Per profitable trade"
            icon={TrendingUp}
            color="text-success"
          />

          <MetricCard
            title="Average Loss"
            value={`$${metrics.avgLoss.toLocaleString()}`}
            subtitle="Per losing trade"
            icon={TrendingDown}
            color="text-destructive"
          />

          <MetricCard
            title="Best Trade"
            value={`$${metrics.bestTrade.toLocaleString()}`}
            subtitle="Highest single trade profit"
            icon={TrendingUp}
            color="text-success"
          />

          <MetricCard
            title="Worst Trade"
            value={`$${Math.abs(metrics.worstTrade).toLocaleString()}`}
            subtitle="Largest single trade loss"
            icon={TrendingDown}
            color="text-destructive"
          />
        </div>
      </CardContent>
    </Card>
  );
}