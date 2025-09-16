import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade, Binding } from '@/types/database';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Plus, 
  DollarSign,
  BarChart3,
  Wallet,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function TraderDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalInvestments: 0,
    totalValue: 0,
    totalPnL: 0,
    activeInvestors: 0,
    pendingRequests: 0
  });
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      // Fetch bindings
      const { data: bindings } = await supabase
        .from('bindings')
        .select('*')
        .eq('trader_id', profile?.id);

      if (trades) {
        const tradeCategories = ['spot', 'futures'];
        const investmentCategories = ['defi', 'dual_investment', 'liquidity_pool', 'liquidity_mining'];
        
        const totalTrades = trades.filter(t => tradeCategories.includes(t.category)).length;
        const totalInvestments = trades.filter(t => investmentCategories.includes(t.category)).length;
        
        const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
        const totalPnL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

        setStats({
          totalTrades,
          totalInvestments,
          totalValue,
          totalPnL,
          activeInvestors: bindings?.filter(b => b.status === 'approved').length || 0,
          pendingRequests: bindings?.filter(b => b.status === 'pending').length || 0
        });

        setRecentTrades(trades.slice(0, 5) as Trade[]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    className = "crypto-card" 
  }: any) => (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="p-3 bg-primary/20 rounded-xl">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Your crypto trading overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/trades/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Trade
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Portfolio Value"
          value={`${profile?.currency === 'USD' ? '$' : '₱'}${stats.totalValue.toLocaleString()}`}
          subtitle="Total investment value"
          icon={Wallet}
          className="crypto-card-blue"
        />
        
        <StatCard
          title="Total P&L"
          value={`${profile?.currency === 'USD' ? '$' : '₱'}${stats.totalPnL.toLocaleString()}`}
          subtitle={stats.totalPnL >= 0 ? 'Profit' : 'Loss'}
          icon={stats.totalPnL >= 0 ? TrendingUp : TrendingDown}
          className={stats.totalPnL >= 0 ? "crypto-card-success" : "crypto-card"}
        />
        
        <StatCard
          title="Total Trades"
          value={stats.totalTrades}
          subtitle={`${stats.totalInvestments} investments`}
          icon={BarChart3}
          className="crypto-card-coral"
        />
        
        <StatCard
          title="Active Investors"
          value={stats.activeInvestors}
          subtitle={`${stats.pendingRequests} pending`}
          icon={Users}
          className="crypto-card"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your trading portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/trades/new">
                <Plus className="w-4 h-4 mr-2" />
                Add New Trade
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/investors">
                <Users className="w-4 h-4 mr-2" />
                Manage Investors
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/analytics">
                <Target className="w-4 h-4 mr-2" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest trades and investments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTrades.length > 0 ? (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {trade.asset.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{trade.asset}</div>
                        <div className="text-xs text-muted-foreground capitalize">{trade.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {profile?.currency === 'USD' ? '$' : '₱'}{trade.price.toLocaleString()}
                      </div>
                      {trade.profit_loss && (
                        <div className={`text-xs ${
                          trade.profit_loss >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/trades">View All Trades</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No trades yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding your first trade or investment
                </p>
                <Button asChild>
                  <Link to="/trades/new">Add Your First Trade</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trader UID Display */}
      {profile?.trader_uid && (
        <Card className="crypto-card-blue">
          <CardHeader>
            <CardTitle>Your Trader ID</CardTitle>
            <CardDescription>Share this ID with investors to let them follow your trades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <code className="flex-1 px-4 py-2 bg-background rounded-lg text-lg font-mono">
                {profile.trader_uid}
              </code>
              <Button 
                variant="outline"
                onClick={() => navigator.clipboard.writeText(profile.trader_uid || '')}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}