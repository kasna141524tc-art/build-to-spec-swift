import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Binding, User as AppUser } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
import { Users, UserCheck, UserX, Clock, Copy, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BindingWithUser extends Binding {
  users: AppUser;
}

export default function Investors() {
  const { profile, isTrader } = useAuth();
  const { toast } = useToast();
  const [bindings, setBindings] = useState<BindingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBinding, setActionBinding] = useState<BindingWithUser | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'revoke' | null>(null);

  useEffect(() => {
    if (profile && isTrader) {
      fetchBindings();
    }
  }, [profile, isTrader]);

  const fetchBindings = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('bindings')
        .select(`
          *,
          users!bindings_investor_id_fkey(*)
        `)
        .eq('trader_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBindings(data as BindingWithUser[]);
    } catch (error) {
      console.error('Error fetching bindings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch investor connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (binding: BindingWithUser, action: 'approve' | 'revoke') => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'revoked';
      
      const { error } = await supabase
        .from('bindings')
        .update({ status: newStatus })
        .eq('id', binding.id);

      if (error) throw error;

      setBindings(prev => 
        prev.map(b => 
          b.id === binding.id 
            ? { ...b, status: newStatus }
            : b
        )
      );

      toast({
        title: action === 'approve' ? "Investor approved" : "Access revoked",
        description: `${binding.users.username} has been ${action === 'approve' ? 'approved' : 'revoked'}.`,
      });

      setActionBinding(null);
      setActionType(null);
      
      // Refresh bindings to ensure UI is up to date
      setTimeout(() => {
        fetchBindings();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyTraderUID = () => {
    if (profile?.trader_uid) {
      navigator.clipboard.writeText(profile.trader_uid);
      toast({
        title: "Copied!",
        description: "Your Trader UID has been copied to clipboard.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/20 text-success">Approved</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isTrader) {
    return (
      <div className="space-y-6">
        <Card className="crypto-card">
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              This page is only available to traders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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

  const pendingCount = bindings.filter(b => b.status === 'pending').length;
  const approvedCount = bindings.filter(b => b.status === 'approved').length;
  const totalCount = bindings.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient-primary">Investor Management</h1>
        <p className="text-muted-foreground">
          Manage your investor connections and data sharing permissions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="crypto-card-blue">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investors</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card-success">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved connections</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="crypto-card-coral">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </div>
              <div className="p-3 bg-primary/20 rounded-xl">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trader UID */}
      <Card className="crypto-card-blue">
        <CardHeader>
          <CardTitle>Your Trader ID</CardTitle>
          <CardDescription>
            Share this unique ID with investors to allow them to connect to your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 px-4 py-2 bg-background rounded-lg text-lg font-mono">
              {profile?.trader_uid}
            </code>
            <Button variant="outline" onClick={copyTraderUID}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bindings Table */}
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Investor Connections</CardTitle>
          <CardDescription>
            Manage your investor connections and their access to your trading data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bindings.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No investors yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your Trader ID with investors to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bindings.map((binding) => (
                  <TableRow key={binding.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {binding.users.username.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{binding.users.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {binding.users.email}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(binding.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(binding.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {binding.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActionBinding(binding);
                              setActionType('approve');
                            }}
                          >
                            Approve
                          </Button>
                        )}
                        {binding.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setActionBinding(binding);
                              setActionType('revoke');
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionBinding} onOpenChange={() => {
        setActionBinding(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Investor' : 'Revoke Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' 
                ? `Are you sure you want to approve ${actionBinding?.users.username}? They will gain read-only access to your trading data.`
                : `Are you sure you want to revoke access for ${actionBinding?.users.username}? They will no longer be able to view your trading data.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => actionBinding && actionType && handleAction(actionBinding, actionType)}
              className={actionType === 'revoke' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionType === 'approve' ? 'Approve' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}