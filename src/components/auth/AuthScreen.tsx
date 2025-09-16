import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Wallet, TrendingUp, Users, Eye } from 'lucide-react';

export function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'trader' as 'trader' | 'investor'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(formData.email, formData.password, {
          role: formData.role,
          username: formData.username
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to CryptoFlow Journal.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="crypto-card p-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">CryptoFlow Journal</h1>
            <p className="text-muted-foreground">Track your crypto trades and investments</p>
          </div>
        </div>

        <Card className="crypto-card">
          <CardHeader>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter your username"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Choose your role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'trader' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'trader' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">Trader</div>
                        <div className="text-xs text-muted-foreground">Log & share trades</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'investor' }))}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.role === 'investor' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-sm font-medium">Investor</div>
                        <div className="text-xs text-muted-foreground">View trader data</div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? "Please wait..." : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="crypto-card-coral p-4 space-y-2">
            <TrendingUp className="w-6 h-6 mx-auto text-coral" />
            <div className="text-sm font-medium">Trade Tracking</div>
          </div>
          <div className="crypto-card-blue p-4 space-y-2">
            <Users className="w-6 h-6 mx-auto text-blue-accent" />
            <div className="text-sm font-medium">Data Sharing</div>
          </div>
        </div>
      </div>
    </div>
  );
}