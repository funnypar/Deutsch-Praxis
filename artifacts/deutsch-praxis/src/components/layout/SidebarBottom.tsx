import React, { useEffect, useState } from 'react';
import { Flame, Zap, BookOpen, Users, CheckCircle, Heart } from 'lucide-react';
import { useGetStreak, useGetAdminStats, User } from '@workspace/api-client-react';
import { useLang } from '@/context/LangContext';

// ── Animated XP bar ───────────────────────────────────────────────
function XpBar({ xp, level, xpToNext }: { xp: number; level: number; xpToNext?: number }) {
  const cap = xpToNext ?? 500;
  const target = Math.min(100, Math.round((xp / cap) * 100));
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 120);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Level {level}</span>
        <span className="text-xs text-muted-foreground">{xp} / {cap} XP</span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 relative overflow-hidden"
          style={{ width: `${width}%`, transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="animate-shimmer absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-right">
        {width}%{level < 10 ? (width === 100 ? '' : ' zum nächsten Level') : ''}
      </p>
    </div>
  );
}

// ── Donate button ─────────────────────────────────────────────────
function DonateButton({ lang, onOpen }: { lang: string; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl
        bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600
        text-slate-100 text-xs font-semibold
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
    >
      <Heart className="h-3.5 w-3.5 fill-slate-300/60" />
      {lang === 'de' ? 'Projekt unterstützen' : 'Support us'}
    </button>
  );
}

// ── Student widget ────────────────────────────────────────────────
function StudentStats({ onOpenDonation }: { onOpenDonation: () => void }) {
  const { data } = useGetStreak();
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  const streakLabel = data.current_streak === 0
    ? (lang === 'de' ? 'Noch keine Serie' : 'No streak yet')
    : lang === 'de'
      ? `${data.current_streak} ${data.current_streak === 1 ? 'Tag' : 'Tage'}`
      : `${data.current_streak} ${data.current_streak === 1 ? 'day' : 'days'}`;

  const sectionTitle = lang === 'de' ? 'Dein Fortschritt' : 'Your progress';
  const streakSub    = lang === 'de' ? 'Lernserie' : 'Learning streak';

  return (
    <div
      className={`mx-3 mb-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-opacity duration-300 ${visible ? 'animate-widget-in' : 'opacity-0'}`}
    >
      <div className="px-4 pt-4 pb-2 border-b border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{sectionTitle}</p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* streak row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 shrink-0">
              <Flame className="animate-flame h-5 w-5 text-orange-500" />
              {data.current_streak > 0 && (
                <span className="absolute inset-0 rounded-xl ring-2 ring-orange-400/30 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground leading-none">{streakLabel}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">{streakSub}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-full px-2.5 py-1">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{data.xp}</span>
          </div>
        </div>

        {/* XP bar */}
        <XpBar xp={data.xp} level={data.level} xpToNext={data.xp_to_next_level} />

        {/* Donate */}
        <DonateButton lang={lang} onOpen={onOpenDonation} />
      </div>
    </div>
  );
}

// ── Teacher widget ────────────────────────────────────────────────
function TeacherStats({ onOpenDonation }: { onOpenDonation: () => void }) {
  const { data } = useGetAdminStats();
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  const sectionTitle = lang === 'de' ? 'Klassen­übersicht' : 'At a glance';

  const rows = [
    { icon: <Users className="h-4 w-4 text-primary" />,            value: data.total_students,    label: lang === 'de' ? 'Schüler'           : 'Students',          color: 'bg-primary/10' },
    { icon: <BookOpen className="h-4 w-4 text-indigo-500" />,      value: data.total_exercises,   label: lang === 'de' ? 'Übungen'           : 'Exercises',         color: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,  value: data.active_this_week,  label: lang === 'de' ? 'Aktiv diese Woche' : 'Active this week',  color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  return (
    <div
      className={`mx-3 mb-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-opacity duration-300 ${visible ? 'animate-widget-in' : 'opacity-0'}`}
    >
      <div className="px-4 pt-4 pb-2 border-b border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{sectionTitle}</p>
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={row.label} className="flex items-center gap-3" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-8 h-8 rounded-lg ${row.color} flex items-center justify-center shrink-0`}>
              {row.icon}
            </div>
            <span className="text-sm text-muted-foreground flex-1">{row.label}</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{row.value}</span>
          </div>
        ))}

        {/* Donate */}
        <DonateButton lang={lang} onOpen={onOpenDonation} />
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────
interface SidebarBottomProps {
  user: User;
  onOpenDonation: () => void;
}

export function SidebarBottom({ user, onOpenDonation }: SidebarBottomProps) {
  return (
    <div className="shrink-0 mt-auto">
      {user.role === 'student'
        ? <StudentStats onOpenDonation={onOpenDonation} />
        : <TeacherStats onOpenDonation={onOpenDonation} />}
    </div>
  );
}
