import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trade, User as AppUser } from '@/types/database';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye,
  DollarSign,
  BarChart3,
  Wallet,
  UserPlus,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function InvestorDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [traderUid, setTraderUid] = useState('');
  const [boundTrader, setBoundTrader] = useState<AppUser | null>(null);
  const [bindingStatus, setBindingStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [traderStats, setTraderStats] = useState({
    totalTrades: 0,
    totalValue: 0,
    totalPnL: 0,
  });
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      checkExistingBinding();
    }
  }, [profile]);

  const checkExistingBinding = async () => {
    try {
      // Check if user already has a binding
      const { data: binding } = await supabase
        .from('bindings')
        .select('*, users!bindings_trader_id_fkey(*)')
        .eq('investor_id', profile?.id)
        .maybeSingle();

      if (binding) {
        setBindingStatus(binding.status as 'pending' | 'approved');
        setBoundTrader(binding.users as AppUser);
        
        if (binding.status === 'approved') {
          await fetchTraderData(binding.trader_id);
        }
      }
    } catch (error) {
      console.error('Error checking binding:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraderData = async (traderId: string) => {
    try {
      // Fetch trader's trades
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', traderId)
        .order('created_at', { ascending: false });

      if (trades) {
        const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
        const totalPnL = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);

        setTraderStats({
          totalTrades: trades.length,
          totalValue,
          totalPnL,
        });

        setRecentTrades(trades.slice(0, 5) as Trade[]);
      }
    } catch (error) {
      console.error('Error fetching trader data:', error);
    }
  };

  const handleBindingRequest = async () => {
    if (!traderUid.trim()) {
      toast({
        title: "Error",
        description: "Please enter a trader UID",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Find trader by UID
      const { data: trader, error: traderError } = await supabase
        .from('users')
        .select('*')
        .eq('trader_uid', traderUid.trim().toUpperCase())
        .eq('role', 'trader')
        .maybeSingle();

      if (traderError || !trader) {
        toast({
          title: "Trader not found",
          description: "Please check the trader UID and try again",
          variant: "destructive",
        });
        return;
      }

      // Create binding request
      const { error: bindingError } = await supabase
        .from('bindings')
        .insert({
          trader_id: trader.id,
          investor_id: profile?.id
        });

      if (bindingError) {
        if (bindingError.code === '23505') { // Unique constraint violation
          toast({
            title: "Already requested",
            description: "You have already sent a request to this trader",
            variant: "destructive",
          });
        } else {
          throw bindingError;
        }
        return;
      }

      setBoundTrader(trader as AppUser);
      setBindingStatus('pending');
      setTraderUid('');
      
      toast({
        title: "Request sent!",
        description: `Binding request sent to ${trader.username}. Please wait for approval.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, className = "crypto-card" }: any) => (
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
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="crypto-card animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-muted/50 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no binding exists, show binding form
  if (bindingStatus === 'none') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Welcome, Investor</h1>
          <p className="text-muted-foreground">
            Connect with a trader to start tracking their performance
          </p>
        </div>

        <Card className="crypto-card-blue max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Connect with a Trader
            </CardTitle>
            <CardDescription>
              Enter the trader's UID to send a binding request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trader-uid">Trader UID</Label>
              <Input
                id="trader-uid"
                value={traderUid}
                onChange={(e) => setTraderUid(e.target.value)}
                placeholder="Enter 8-character UID (e.g., ABC12345)"
                className="uppercase"
                maxLength={8}
              />
            </div>
            <Button 
              onClick={handleBindingRequest}
              disabled={submitting || !traderUid.trim()}
              className="w-full"
            >
              {submitting ? "Sending Request..." : "Send Request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If binding is pending
  if (bindingStatus === 'pending') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Your trader connection status
          </p>
        </div>

        <Card className="crypto-card max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Request Pending</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your request to {boundTrader?.username} is pending approval.
            </p>
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              Waiting for approval
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If approved, show dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Tracking {boundTrader?.username}'s performance
          </p>
        </div>
        <Badge className="bg-success/20 text-success">
          Connected
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Portfolio Value"
          value={`${boundTrader?.currency === 'USD' ? '$' : '₱'}${traderStats.totalValue.toLocaleString()}`}
          subtitle="Total investment value"
          icon={Wallet}
          className="crypto-card-blue"
        />
        
        <StatCard
          title="Total P&L"
          value={`${boundTrader?.currency === 'USD' ? '$' : '₱'}${traderStats.totalPnL.toLocaleString()}`}
          subtitle={traderStats.totalPnL >= 0 ? 'Profit' : 'Loss'}
          icon={traderStats.totalPnL >= 0 ? TrendingUp : TrendingDown}
          className={traderStats.totalPnL >= 0 ? "crypto-card-success" : "crypto-card"}
        />
        
        <StatCard
          title="Total Trades"
          value={traderStats.totalTrades}
          subtitle="All transactions"
          icon={BarChart3}
          className="crypto-card-coral"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest trades from {boundTrader?.username}</CardDescription>
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
                        {boundTrader?.currency === 'USD' ? '$' : '₱'}{trade.price.toLocaleString()}
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
                <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No trades yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your trader hasn't made any trades yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trader Info */}
        <Card className="crypto-card-blue">
          <CardHeader>
            <CardTitle>Connected Trader</CardTitle>
            <CardDescription>Trader information and stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {boundTrader?.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium">{boundTrader?.username}</div>
                <div className="text-sm text-muted-foreground">
                  Trader ID: {boundTrader?.trader_uid}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold">{traderStats.totalTrades}</div>
                <div className="text-xs text-muted-foreground">Total Trades</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {boundTrader?.currency === 'USD' ? '$' : '₱'}{Math.abs(traderStats.totalPnL).toLocaleString()}
                </div>
                <div className={`text-xs ${traderStats.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {traderStats.totalPnL >= 0 ? 'Profit' : 'Loss'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}