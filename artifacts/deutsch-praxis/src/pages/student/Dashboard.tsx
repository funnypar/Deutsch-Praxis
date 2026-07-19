import React from 'react';
import { useGetDashboard, useGetMe } from '@workspace/api-client-react';
import { Loader2, Flame, Trophy, BookA, ListTree, Headphones, PenTool, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { Progress } from '@/components/ui/progress';
import { useLang } from '@/context/LangContext';

export default function Dashboard() {
  const { data: user } = useGetMe();
  const { data: dashboard, isLoading } = useGetDashboard();
  const { t, lang } = useLang();

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const quickLinks = [
    { href: '/vocab',     label: t('vocab'),     icon: BookA,      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    { href: '/grammar',   label: t('grammar'),   icon: ListTree,   color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    { href: '/listening', label: t('listening'), icon: Headphones, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { href: '/writing',   label: t('writing'),   icon: PenTool,    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  ];

  const activityLocale = lang === 'de' ? 'de-DE' : 'en-GB';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero */}
      <div className="bg-primary text-primary-foreground rounded-3xl p-8 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
              {t('dashGreeting')}, {user?.display_name}!
            </h1>
            <p className="text-primary-foreground/80 text-lg">{t('dashSubtitle')}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-accent text-accent-foreground rounded-full">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboard.streak}</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-primary-foreground/70">
                  {t('dashDayStreak')}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-secondary text-secondary-foreground rounded-full">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">Lvl {dashboard.level}</div>
                <div className="text-xs uppercase tracking-wider font-semibold text-primary-foreground/70">
                  {dashboard.xp} XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {dashboard.xp_to_next_level && (
          <div className="relative z-10 mt-8 max-w-md">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>{t('dashProgressTo')} {dashboard.level + 1}</span>
              <span>{dashboard.xp_to_next_level} {t('dashXpToGo')}</span>
            </div>
            <Progress value={70} className="h-2 bg-black/20" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick start */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
              {t('dashPracticeToday')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block group">
                  <div className="bg-card border border-border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md h-full">
                    <div className={`p-3 rounded-xl inline-block mb-3 ${link.color}`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {link.label}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Due today */}
          {dashboard.due_today > 0 && (
            <section>
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                    <BookA className="h-5 w-5 text-accent" />
                    {t('dashReviewVocab')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('dashYouHave')} {dashboard.due_today} {t('dashDueCards')}.
                  </p>
                </div>
                <Link
                  href="/vocab"
                  className="shrink-0 w-full sm:w-auto text-center inline-block px-6 py-3 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 transition-colors"
                >
                  {t('dashPracticeNow')}
                </Link>
              </div>
            </section>
          )}

          {/* Recent activity */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
              {t('dashRecentActivity')}
            </h2>
            {dashboard.recent_activity.length > 0 ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {dashboard.recent_activity.map((activity, i) => (
                  <div
                    key={i}
                    className={`p-4 flex items-center gap-4 ${i !== dashboard.recent_activity.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className={`p-2 rounded-full shrink-0 ${activity.correct ? 'bg-correct/10 text-correct' : 'bg-destructive/10 text-destructive'}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{activity.description}</p>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        {activity.type} • {new Date(activity.timestamp).toLocaleDateString(activityLocale)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border border-dashed rounded-2xl p-8 text-center text-muted-foreground">
                {t('dashNoActivity')}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">

          {/* Weak spots */}
          <section>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
              {t('dashWeakSpots')}
            </h2>
            <div className="bg-card border border-border rounded-2xl p-6">
              {dashboard.weak_spots.length > 0 ? (
                <div className="space-y-6">
                  {dashboard.weak_spots.map((spot, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-foreground">{spot.grammar_tag}</span>
                        <span className="text-destructive font-bold">
                          {Math.round(spot.accuracy * 100)}% {t('dashCorrect')}
                        </span>
                      </div>
                      <Progress value={spot.accuracy * 100} className="h-2 bg-muted [&>div]:bg-destructive" />
                      <div className="mt-2 flex justify-end">
                        <Link
                          href={`/grammar?tag=${encodeURIComponent(spot.grammar_tag)}`}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          {t('dashPracticeThis')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center p-3 bg-correct/10 text-correct rounded-full mb-3">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-foreground">{t('dashAllGood')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('dashNoData')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
