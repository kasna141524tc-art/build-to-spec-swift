import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioChart } from '@/components/analytics/PortfolioChart';
import { AssetAllocation } from '@/components/analytics/AssetAllocation';
import { PerformanceMetrics } from '@/components/analytics/PerformanceMetrics';
import { TradeFrequency } from '@/components/analytics/TradeFrequency';
import { ProfitLossChart } from '@/components/analytics/ProfitLossChart';
import { BarChart3, TrendingUp, DollarSign, Target } from 'lucide-react';

export default function Analytics() {
  const { profile, isTrader } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalValue: 0,
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgHoldingPeriod: 0,
    bestPerformer: '',
    worstPerformer: '',
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [profile]);

  const fetchAnalyticsData = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: true });

      // For traders, get their own trades
      if (isTrader) {
        query = query.eq('user_id', profile.id);
      } else {
        // For investors, get their bound trader's trades
        const { data: bindings } = await supabase
          .from('bindings')
          .select('trader_id')
          .eq('investor_id', profile.id)
          .eq('status', 'approved')
          .maybeSingle();

        if (bindings) {
          query = query.eq('user_id', bindings.trader_id);
        } else {
          setTrades([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const tradesData = data as Trade[];
      setTrades(tradesData);

      // Calculate analytics
      const totalValue = tradesData.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
      const totalPnL = tradesData.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      const profitableTrades = tradesData.filter(trade => (trade.profit_loss || 0) > 0).length;
      const winRate = tradesData.length > 0 ? (profitableTrades / tradesData.length) * 100 : 0;

      // Asset performance
      const assetPerformance = tradesData.reduce((acc, trade) => {
        if (!acc[trade.asset]) {
          acc[trade.asset] = { pnl: 0, trades: 0 };
        }
        acc[trade.asset].pnl += trade.profit_loss || 0;
        acc[trade.asset].trades += 1;
        return acc;
      }, {} as Record<string, { pnl: number; trades: number }>);

      const sortedAssets = Object.entries(assetPerformance)
        .sort(([,a], [,b]) => b.pnl - a.pnl);

      setAnalytics({
        totalValue,
        totalPnL,
        totalTrades: tradesData.length,
        winRate,
        avgHoldingPeriod: 0, // TODO: Calculate based on buy/sell pairs
        bestPerformer: sortedAssets[0]?.[0] || '',
        worstPerformer: sortedAssets[sortedAssets.length - 1]?.[0] || '',
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: profile?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="crypto-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Analytics</h1>
        <p className="text-muted-foreground">
          {isTrader 
            ? 'Comprehensive analysis of your trading performance' 
            : 'Your trader\'s performance insights'
          }
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="crypto-card-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={analytics.totalPnL >= 0 ? "crypto-card-success" : "crypto-card"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total P&L</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalPnL)}</p>
                <p className={`text-xs ${analytics.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {analytics.totalPnL >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card-coral">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{analytics.totalTrades}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.winRate.toFixed(1)}% win rate
                </p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Performer</p>
                <p className="text-2xl font-bold">{analytics.bestPerformer || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">Top asset</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <Target className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="frequency">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioChart trades={trades} />
            <PerformanceMetrics trades={trades} />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <ProfitLossChart trades={trades} />
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <AssetAllocation trades={trades} />
        </TabsContent>

        <TabsContent value="frequency" className="space-y-6">
          <TradeFrequency trades={trades} />
        </TabsContent>
      </Tabs>
    </div>
  );
}