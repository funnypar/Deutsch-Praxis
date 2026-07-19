import React from 'react';
import { Flame, Zap, BookOpen, Users, CheckCircle } from 'lucide-react';
import { useGetStreak, useGetAdminStats, User } from '@workspace/api-client-react';
import { useLang } from '@/context/LangContext';

// ── XP progress bar ──────────────────────────────────────────────
function XpBar({ xp, level, xpToNext }: { xp: number; level: number; xpToNext?: number }) {
  const cap = xpToNext ?? 500;
  const pct = Math.min(100, Math.round((xp / cap) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Level {level}</span>
        <span className="text-muted-foreground">{xp} / {cap} XP</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Student stats ────────────────────────────────────────────────
function StudentStats() {
  const { data } = useGetStreak();
  const { lang } = useLang();
  if (!data) return null;

  const streakLabel = lang === 'de'
    ? `${data.current_streak} ${data.current_streak === 1 ? 'Tag' : 'Tage'}`
    : `${data.current_streak} ${data.current_streak === 1 ? 'day' : 'days'}`;
  const streakTip = lang === 'de' ? 'Lernserie' : 'streak';

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-secondary/40 rounded-xl mx-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-none">{streakLabel}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 capitalize">{streakTip}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-foreground">{data.xp} XP</span>
        </div>
      </div>
      <XpBar xp={data.xp} level={data.level} xpToNext={data.xp_to_next_level} />
    </div>
  );
}

// ── Teacher stats ────────────────────────────────────────────────
function TeacherStats() {
  const { data } = useGetAdminStats();
  const { lang } = useLang();
  if (!data) return null;

  const rows = [
    { icon: <Users className="h-3.5 w-3.5 text-primary" />, value: data.total_students,   label: lang === 'de' ? 'Schüler' : 'Students' },
    { icon: <BookOpen className="h-3.5 w-3.5 text-primary" />, value: data.total_exercises, label: lang === 'de' ? 'Übungen' : 'Exercises' },
    { icon: <CheckCircle className="h-3.5 w-3.5 text-primary" />, value: data.active_this_week, label: lang === 'de' ? 'Aktiv diese Woche' : 'Active this week' },
  ];

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3 bg-secondary/40 rounded-xl mx-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {row.icon}
            <span className="text-xs text-muted-foreground">{row.label}</span>
          </div>
          <span className="text-xs font-bold text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────
interface SidebarBottomProps {
  user: User;
}

export function SidebarBottom({ user }: SidebarBottomProps) {
  return (
    <div className="px-0 pb-4 pt-2 shrink-0">
      {user.role === 'student' ? <StudentStats /> : <TeacherStats />}
    </div>
  );
}
