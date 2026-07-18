import React, { useState } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { useGetMe } from '@workspace/api-client-react';
import { Shell } from '@/components/layout/Shell';

// Pages
import Dashboard from '@/pages/student/Dashboard';
import Login from '@/pages/auth/Login';
import VocabTrainer from '@/pages/student/VocabTrainer';
import GrammarDrills from '@/pages/student/GrammarDrills';
import Listening from '@/pages/student/Listening';
import Writing from '@/pages/student/Writing';
import Progress from '@/pages/student/Progress';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminExercises from '@/pages/admin/AdminExercises';
import AdminVocab from '@/pages/admin/AdminVocab';
import AdminClasses from '@/pages/admin/AdminClasses';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: { component: any, adminOnly?: boolean, [key: string]: any }) {
  const { data: user, isLoading, isError } = useGetMe();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && (isError || !user)) {
      setLocation('/login');
    }
  }, [user, isLoading, isError, setLocation]);

  if (isLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-background"><div className="animate-pulse flex flex-col items-center gap-4"><div className="w-8 h-8 rounded-full bg-primary/20"></div><div className="text-sm text-muted-foreground font-serif">Laden...</div></div></div>;
  }

  if (!user) return null;

  if (adminOnly && user.role !== 'teacher') {
    setLocation('/');
    return null;
  }

  return (
    <Shell user={user}>
      <Component {...rest} />
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Student Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/vocab">
        <ProtectedRoute component={VocabTrainer} />
      </Route>
      <Route path="/grammar">
        <ProtectedRoute component={GrammarDrills} />
      </Route>
      <Route path="/listening">
        <ProtectedRoute component={Listening} />
      </Route>
      <Route path="/writing">
        <ProtectedRoute component={Writing} />
      </Route>
      <Route path="/progress">
        <ProtectedRoute component={Progress} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/exercises">
        <ProtectedRoute component={AdminExercises} adminOnly />
      </Route>
      <Route path="/admin/vocab">
        <ProtectedRoute component={AdminVocab} adminOnly />
      </Route>
      <Route path="/admin/classes">
        <ProtectedRoute component={AdminClasses} adminOnly />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute component={AdminAnalytics} adminOnly />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
