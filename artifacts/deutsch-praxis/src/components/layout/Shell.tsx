import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLogout, User } from '@workspace/api-client-react';
import { BookOpen, GraduationCap, LayoutDashboard, ListTree, Headphones, PenTool, BarChart3, LogOut, Menu, X, Users, BookA, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileDialog } from './ProfileDialog';

interface ShellProps {
  user: User;
  children: React.ReactNode;
}

export function Shell({ user, children }: ShellProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem('dp_token');
        queryClient.clear();
        setLocation('/login');
      }
    });
  };

  const studentLinks = [
    { href: '/', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/vocab', label: 'Wortschatz', icon: BookA },
    { href: '/grammar', label: 'Grammatik', icon: ListTree },
    { href: '/listening', label: 'Hören', icon: Headphones },
    { href: '/writing', label: 'Schreiben', icon: PenTool },
    { href: '/progress', label: 'Fortschritt', icon: BarChart3 },
  ];

  const teacherLinks = [
    { href: '/admin', label: 'Übersicht', icon: LayoutDashboard },
    { href: '/admin/classes', label: 'Klassen', icon: Users },
    { href: '/admin/exercises', label: 'Übungen', icon: GraduationCap },
    { href: '/admin/vocab', label: 'Wortschatz', icon: BookOpen },
    { href: '/admin/analytics', label: 'Analysen', icon: BarChart3 },
  ];

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary font-serif font-bold text-xl">
          <GraduationCap className="h-6 w-6" />
          DeutschPraxis
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:relative md:h-screen md:sticky md:top-0
      `}>
        <div className="p-6 hidden md:flex items-center gap-2 text-primary font-serif font-bold text-2xl border-b border-border">
          <GraduationCap className="h-8 w-8" />
          DeutschPraxis
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== '/' && link.href !== '/admin' && location.startsWith(link.href));
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-secondary transition-colors group text-left"
            title="Profil bearbeiten"
          >
            <Avatar className="h-10 w-10 border-2 border-secondary shrink-0">
              {user.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-serif">
                {user.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-foreground truncate">{user.display_name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role} {user.current_level ? `• ${user.current_level}` : ''}</span>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-3" />
            Abmelden
          </Button>
        </div>

        <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background md:overflow-y-auto">
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}