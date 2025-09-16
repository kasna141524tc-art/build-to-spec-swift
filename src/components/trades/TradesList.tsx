import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trade } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TradeForm } from './TradeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TradesListProps {
  category?: string;
}

export function TradesList({ category }: TradesListProps) {
  const { profile, isTrader } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [deletingTrade, setDeletingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    fetchTrades();
  }, [profile, category]);

  const fetchTrades = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false });

      // For traders, get their own trades
      if (isTrader) {
        query = query.eq('user_id', profile.id);
      } else {
        // For investors, get their bound trader's trades
        // Check if investor has an approved binding
        if (profile.bound_trader_id) {
          // Verify the binding is still approved
          const { data: binding } = await supabase
            .from('bindings')
            .select('status')
            .eq('investor_id', profile.id)
            .eq('trader_id', profile.bound_trader_id)
            .eq('status', 'approved')
            .maybeSingle();
            
          if (binding) {
            query = query.eq('user_id', profile.bound_trader_id);
          } else {
            setTrades([]);
            setLoading(false);
            return;
          }
        } else {
          setTrades([]);
          setLoading(false);
          return;
        }
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrades(data as Trade[]);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trade: Trade) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', trade.id);

      if (error) throw error;

      setTrades(prev => prev.filter(t => t.id !== trade.id));
      setDeletingTrade(null);
      
      toast({
        title: "Trade deleted",
        description: "The trade has been successfully deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, string> = {
      spot: 'default',
      futures: 'secondary',
      defi: 'outline',
      dual_investment: 'destructive',
      liquidity_pool: 'default',
      liquidity_mining: 'secondary',
    };

    return (
      <Badge variant={variants[category] as any}>
        {category.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="crypto-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted/50 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="crypto-card">
        <CardContent className="p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No trades found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isTrader 
              ? "Start by adding your first trade or investment"
              : "Your trader hasn't made any trades yet"
            }
          </p>
          {isTrader && (
            <Button onClick={() => setEditingTrade({} as Trade)}>
              Add Your First Trade
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="crypto-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>P&L</TableHead>
                {isTrader && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.asset}</TableCell>
                  <TableCell>{getCategoryBadge(trade.category)}</TableCell>
                  <TableCell>
                    {formatCurrency(trade.price, trade.currency)}
                  </TableCell>
                  <TableCell>{trade.quantity.toLocaleString()}</TableCell>
                  <TableCell>
                    {format(new Date(trade.trade_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {trade.profit_loss ? (
                      <div className={`flex items-center gap-1 ${
                        trade.profit_loss >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {trade.profit_loss >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {formatCurrency(Math.abs(trade.profit_loss), trade.currency)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {isTrader && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTrade(trade)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingTrade(trade)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTrade} onOpenChange={() => setEditingTrade(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrade?.id ? 'Edit Trade' : 'Add New Trade'}
            </DialogTitle>
          </DialogHeader>
          {editingTrade && (
            <TradeForm 
              trade={editingTrade.id ? editingTrade : undefined}
              onSuccess={() => {
                setEditingTrade(null);
                fetchTrades();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTrade} onOpenChange={() => setDeletingTrade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTrade && handleDelete(deletingTrade)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}