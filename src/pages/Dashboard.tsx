import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasRole } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalExpenses: number;
  pendingApprovals: number;
  approvedClaims: number;
  rejectedClaims: number;
}

export default function Dashboard() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    pendingApprovals: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
  });
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true);
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      const pending = expenses?.filter(e => e.status === 'pending').length || 0;
      const approved = expenses?.filter(e => e.status === 'approved').length || 0;
      const rejected = expenses?.filter(e => e.status === 'rejected').length || 0;
      const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        totalExpenses: total,
        pendingApprovals: pending,
        approvedClaims: approved,
        rejectedClaims: rejected,
      });

      // Category breakdown
      const categoryMap = new Map();
      expenses?.forEach(e => {
        const current = categoryMap.get(e.category) || 0;
        categoryMap.set(e.category, current + Number(e.amount));
      });

      const chartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: Number(value)
      }));
      setCategoryData(chartData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['hsl(221 83% 53%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)', 'hsl(271 91% 65%)'];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Expense Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor and manage your company expenses
              </p>
            </div>
            {hasRole(roles, 'admin') && (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-md border border-primary/20">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Admin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</p>
                <h3 className="text-2xl font-semibold mt-2 text-foreground">${stats.totalExpenses.toFixed(2)}</h3>
              </div>
              <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
                <h3 className="text-2xl font-semibold mt-2 text-foreground">{stats.pendingApprovals}</h3>
              </div>
              <div className="h-10 w-10 rounded-md bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved</p>
                <h3 className="text-2xl font-semibold mt-2 text-foreground">{stats.approvedClaims}</h3>
              </div>
              <div className="h-10 w-10 rounded-md bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Rejected</p>
                <h3 className="text-2xl font-semibold mt-2 text-foreground">{stats.rejectedClaims}</h3>
              </div>
              <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border shadow-sm p-6">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Expenses by Category
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                No expense data available
              </div>
            )}
          </Card>

          <Card className="border shadow-sm p-6">
            <h3 className="text-base font-semibold mb-4 text-foreground">Category Distribution</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                No expense data available
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
