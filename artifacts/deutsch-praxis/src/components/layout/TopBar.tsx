import React, { useState } from 'react';
import { GraduationCap, Sun, Moon, LogOut, Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from '@/context/ThemeContext';
import { useLang } from '@/context/LangContext';
import type { User } from '@workspace/api-client-react';

interface TopBarProps {
  user: User;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function TopBar({ user, isMobileMenuOpen, onToggleMobileMenu, onOpenProfile, onLogout }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border flex items-center gap-2 px-4 h-14 shrink-0">
      {/* Mobile: hamburger */}
      <button
        className="md:hidden p-2 -ml-1 text-foreground rounded-lg hover:bg-secondary transition-colors"
        onClick={onToggleMobileMenu}
        aria-label="Menu"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Logo — mobile only (desktop has it in sidebar) */}
      <div className="md:hidden flex items-center gap-2 text-primary font-serif font-bold text-lg">
        <GraduationCap className="h-5 w-5" />
        DeutschPraxis
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
          className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground font-medium text-xs"
          title={t('language')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline uppercase tracking-wide">{lang === 'de' ? 'DE' : 'EN'}</span>
        </Button>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* User avatar → open profile dialog */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors group"
          title={t('editProfile')}
        >
          <Avatar className="h-7 w-7 border border-secondary">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-serif text-xs">
              {user.display_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium text-foreground max-w-[120px] truncate">
            {user.display_name}
          </span>
        </button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title={t('logout')}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
