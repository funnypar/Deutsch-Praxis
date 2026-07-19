import React from 'react';
import { Flame, Zap, BookOpen, Users, CheckCircle, CalendarClock, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

// ── Student stats panel ──────────────────────────────────────────
function StudentStats() {
  const { data } = useGetStreak();
  const { lang } = useLang();

  if (!data) return null;

  const streakLabel = lang === 'de'
    ? `${data.current_streak} ${data.current_streak === 1 ? 'Tag' : 'Tage'}`
    : `${data.current_streak} ${data.current_streak === 1 ? 'day' : 'days'}`;

  const dueLabel = lang === 'de' ? 'Karten heute' : 'cards today';
  const streakTip = lang === 'de' ? 'Lernserie' : 'streak';

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-secondary/40 rounded-xl mx-3">
      {/* Streak row */}
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

      {/* XP bar */}
      <XpBar xp={data.xp} level={data.level} xpToNext={data.xp_to_next_level} />
    </div>
  );
}

// ── Teacher stats panel ──────────────────────────────────────────
function TeacherStats() {
  const { data } = useGetAdminStats();
  const { lang } = useLang();

  if (!data) return null;

  const rows = [
    {
      icon: <Users className="h-3.5 w-3.5 text-primary" />,
      value: data.total_students,
      label: lang === 'de' ? 'Schüler' : 'Students',
    },
    {
      icon: <BookOpen className="h-3.5 w-3.5 text-primary" />,
      value: data.total_exercises,
      label: lang === 'de' ? 'Übungen' : 'Exercises',
    },
    {
      icon: <CheckCircle className="h-3.5 w-3.5 text-primary" />,
      value: data.active_this_week,
      label: lang === 'de' ? 'Aktiv diese Woche' : 'Active this week',
    },
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

// ── CEFR level badge ────────────────────────────────────────────
const levelColors: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  A2: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  B1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  B2: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  C1: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
};

// ── Main export ──────────────────────────────────────────────────
interface SidebarBottomProps {
  user: User;
  onOpenProfile: () => void;
}

export function SidebarBottom({ user, onOpenProfile }: SidebarBottomProps) {
  return (
    <div className="flex flex-col gap-3 pb-4 pt-2 shrink-0">
      {/* Stats widget */}
      {user.role === 'student' ? <StudentStats /> : <TeacherStats />}

      {/* Divider */}
      <div className="h-px bg-border mx-3" />

      {/* Profile mini-card */}
      <button
        type="button"
        onClick={onOpenProfile}
        className="mx-3 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group text-left"
      >
        <Avatar className="h-9 w-9 border-2 border-secondary shrink-0">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover" />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm">
            {user.display_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate leading-tight">
            {user.display_name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {user.current_level && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${levelColors[user.current_level] ?? 'bg-muted text-muted-foreground'}`}>
                {user.current_level}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground capitalize">
              {user.role === 'teacher' ? 'Lehrer' : 'Schüler'}
            </span>
          </div>
        </div>

        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>
    </div>
  );
}
