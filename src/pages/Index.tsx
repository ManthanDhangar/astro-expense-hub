import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-cyan">
                <TrendingUp className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                ExpenseFlow
              </h1>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto">
              The Future of Corporate Expense Management
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline approvals, automate workflows, and gain real-time insights 
              with our next-generation expense platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-cyan text-lg px-8"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="glass-hover text-lg px-8"
                onClick={() => navigate('/auth')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-2xl glass-hover transition-smooth">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 glow-cyan">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Submit and approve expenses in seconds with our intuitive interface 
              and automated workflows
            </p>
          </div>

          <div className="glass p-8 rounded-2xl glass-hover transition-smooth">
            <div className="h-14 w-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 glow-purple">
              <Shield className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
            <p className="text-muted-foreground">
              Bank-level encryption and role-based access control protect your 
              sensitive financial data
            </p>
          </div>

          <div className="glass p-8 rounded-2xl glass-hover transition-smooth">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 glow-cyan">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Real-time Analytics</h3>
            <p className="text-muted-foreground">
              Track spending patterns and make data-driven decisions with 
              comprehensive dashboards
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass p-12 rounded-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Expense Management?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking companies using ExpenseFlow to save time and reduce costs
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-cyan text-lg px-12"
            onClick={() => navigate('/auth')}
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
