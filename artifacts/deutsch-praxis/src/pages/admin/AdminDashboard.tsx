import React from 'react';
import { useGetAdminStats } from '@workspace/api-client-react';
import { Loader2, Users, BookOpen, GraduationCap, Activity, BookA } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading || !stats) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  const statCards = [
    { title: 'Aktive Nutzer', value: stats.active_this_week, subtitle: 'Diese Woche', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Lernende', value: stats.total_students, subtitle: 'Gesamt', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { title: 'Übungen', value: stats.total_exercises, subtitle: 'In der Datenbank', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Vokabeln', value: stats.total_vocab, subtitle: 'In der Datenbank', icon: BookA, color: 'text-purple-500', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Admin Übersicht</h1>
        <p className="text-muted-foreground mt-2">Plattform-Statistiken und Verwaltung</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">{stat.title}</p>
              <h3 className="text-4xl font-serif font-bold text-foreground mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-muted-foreground">{stat.subtitle}</p>
            </div>
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-serif font-bold text-foreground mb-6">Übungen nach Niveau</h3>
          <div className="space-y-4">
            {stats.exercises_by_level && Object.entries(stats.exercises_by_level).map(([level, count]: [string, any]) => (
              <div key={level} className="flex items-center gap-4">
                <div className="w-12 text-sm font-bold text-muted-foreground">{level}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.max(5, (count / stats.total_exercises) * 100)}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-serif font-bold text-foreground mb-6">Übungen nach Typ</h3>
          <div className="space-y-4">
            {stats.exercises_by_type && Object.entries(stats.exercises_by_type).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center gap-4">
                <div className="w-24 text-sm font-bold text-muted-foreground capitalize">{type}</div>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full" 
                    style={{ width: `${Math.max(5, (count / stats.total_exercises) * 100)}%` }}
                  />
                </div>
                <div className="w-12 text-right text-sm font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}