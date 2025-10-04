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

  const COLORS = ['hsl(189 97% 55%)', 'hsl(271 91% 65%)', 'hsl(120 70% 50%)', 'hsl(40 90% 55%)'];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your expense overview
            </p>
          </div>
          {hasRole(roles, 'admin') && (
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Admin Access</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass p-6 glass-hover transition-smooth">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <h3 className="text-2xl font-bold mt-1">${stats.totalExpenses.toFixed(2)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center glow-cyan">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="glass p-6 glass-hover transition-smooth">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <h3 className="text-2xl font-bold mt-1">{stats.pendingApprovals}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center glow-purple">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="glass p-6 glass-hover transition-smooth">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Claims</p>
                <h3 className="text-2xl font-bold mt-1">{stats.approvedClaims}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="glass p-6 glass-hover transition-smooth">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected Claims</p>
                <h3 className="text-2xl font-bold mt-1">{stats.rejectedClaims}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Expenses by Category
            </h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 25%)" />
                  <XAxis dataKey="name" stroke="hsl(215 20% 65%)" />
                  <YAxis stroke="hsl(215 20% 65%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 40% 14%)',
                      border: '1px solid hsl(222 40% 25%)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(189 97% 55%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            )}
          </Card>

          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
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
                    fill="hsl(189 97% 55%)"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222 40% 14%)',
                      border: '1px solid hsl(222 40% 25%)',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
