import { useAuth } from '@/hooks/useAuth';
import { TraderDashboard } from '@/components/dashboard/TraderDashboard';
import { InvestorDashboard } from '@/components/dashboard/InvestorDashboard';

export default function Dashboard() {
  const { isTrader } = useAuth();

  return (
    <div className="space-y-6">
      {isTrader ? <TraderDashboard /> : <InvestorDashboard />}
    </div>
  );
}