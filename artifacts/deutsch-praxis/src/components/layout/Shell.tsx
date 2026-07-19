import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useLogout, User } from '@workspace/api-client-react';
import {
  BookOpen, GraduationCap, LayoutDashboard, ListTree,
  Headphones, PenTool, BarChart3, Users, BookA,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLang } from '@/context/LangContext';
import { TopBar } from './TopBar';
import { ProfileDialog } from './ProfileDialog';
import { SidebarBottom } from './SidebarBottom';

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
  const { t } = useLang();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem('dp_token');
        queryClient.clear();
        setLocation('/login');
      },
    });
  };

  const studentLinks = [
    { href: '/',          label: t('overview'),  icon: LayoutDashboard },
    { href: '/vocab',     label: t('vocab'),     icon: BookA },
    { href: '/grammar',   label: t('grammar'),   icon: ListTree },
    { href: '/listening', label: t('listening'), icon: Headphones },
    { href: '/writing',   label: t('writing'),   icon: PenTool },
    { href: '/progress',  label: t('progress'),  icon: BarChart3 },
  ];

  const teacherLinks = [
    { href: '/admin',            label: t('overview'),  icon: LayoutDashboard },
    { href: '/admin/classes',    label: t('classes'),   icon: Users },
    { href: '/admin/exercises',  label: t('exercises'), icon: BookOpen },
    { href: '/admin/vocab',      label: t('vocab'),     icon: BookA },
    { href: '/admin/analytics',  label: t('analytics'), icon: BarChart3 },
  ];

  const links = user.role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* ── Top Bar ───────────────────────────────────────────── */}
      <TopBar
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((v) => !v)}
        onOpenProfile={() => setProfileOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out flex flex-col
          top-14 bottom-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0
        `}>
          {/* Logo — desktop only */}
          <div className="p-5 hidden md:flex items-center gap-2 text-primary font-serif font-bold text-xl border-b border-border shrink-0">
            <GraduationCap className="h-6 w-6" />
            DeutschPraxis
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            {links.map((link) => {
              const isActive =
                location === link.href ||
                (link.href !== '/' && link.href !== '/admin' && location.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: stats widget */}
          <SidebarBottom user={user} />
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
