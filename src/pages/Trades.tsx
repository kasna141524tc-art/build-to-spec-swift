import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { TradesList } from '@/components/trades/TradesList';
import { TradeForm } from '@/components/trades/TradeForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Trades() {
  const { isTrader } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient-primary">
            {isTrader ? 'Trade Journal' : 'Trader Activity'}
          </h1>
          <p className="text-muted-foreground">
            {isTrader 
              ? 'Manage your crypto trades and investments' 
              : 'View your trader\'s portfolio activity'
            }
          </p>
        </div>
        
        {isTrader && (
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Trade
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Trade</DialogTitle>
                </DialogHeader>
                <TradeForm onSuccess={() => setIsFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>
            Filter by category to view specific trade types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="spot">Spot</TabsTrigger>
              <TabsTrigger value="futures">Futures</TabsTrigger>
              <TabsTrigger value="defi">DeFi</TabsTrigger>
              <TabsTrigger value="dual_investment">Dual</TabsTrigger>
              <TabsTrigger value="liquidity_pool">LP</TabsTrigger>
              <TabsTrigger value="liquidity_mining">Mining</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="mt-6">
              <TradesList category={selectedCategory === 'all' ? undefined : selectedCategory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}