import React from 'react';
import { useGetProgressSummary, useGetStreak } from '@workspace/api-client-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, BarChart3, Trophy, Flame, Target } from 'lucide-react';
import { Link } from 'wouter';

export default function Progress() {
  const { data: summary, isLoading: isLoadingSummary } = useGetProgressSummary();
  const { data: streak, isLoading: isLoadingStreak } = useGetStreak();

  if (isLoadingSummary || isLoadingStreak || !summary || !streak) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  // Format data for Recharts
  const chartData = summary.weak_spots.map(spot => ({
    name: spot.grammar_tag,
    accuracy: Math.round(spot.accuracy * 100),
    attempts: spot.total_attempts,
  })).sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Dein Lernfortschritt</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Streak Card */}
        <div className="bg-accent text-accent-foreground rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Flame className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold opacity-90 text-sm uppercase tracking-wider mb-2">Aktueller Streak</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold">{streak.current_streak}</span>
              <span className="text-lg opacity-90 font-medium">Tage</span>
            </div>
            <p className="mt-4 text-sm font-medium opacity-80">Längster Streak: {streak.longest_streak} Tage</p>
          </div>
        </div>

        {/* XP Card */}
        <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold opacity-90 text-sm uppercase tracking-wider mb-2">Erfahrungspunkte</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold">{streak.xp}</span>
              <span className="text-lg opacity-90 font-medium">XP</span>
            </div>
            <p className="mt-4 text-sm font-medium opacity-80">Level {streak.level} erreicht</p>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-muted/30">
            <Target className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-2">Gesamtgenauigkeit</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold text-foreground">{Math.round(summary.accuracy * 100)}</span>
              <span className="text-lg text-muted-foreground font-medium">%</span>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">{summary.correct_answers} von {summary.total_exercises} richtig</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 className="text-xl font-serif font-bold text-foreground mb-6">Genauigkeit nach Thema</h3>
          {chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value}%`, 'Genauigkeit']}
                  />
                  <Bar dataKey="accuracy" radius={[0, 6, 6, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.accuracy > 75 ? 'hsl(var(--correct))' : entry.accuracy > 50 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-2xl">
              Nicht genug Daten für ein Diagramm
            </div>
          )}
        </div>

        {/* Actionable Weak Spots */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-serif font-bold text-foreground mb-6 flex items-center justify-between">
            Handlungsbedarf
            <span className="text-xs font-bold bg-destructive/10 text-destructive px-3 py-1 rounded-full">
              {summary.weak_spots.length} Themen
            </span>
          </h3>
          
          {summary.weak_spots.length > 0 ? (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {summary.weak_spots.map((spot, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-secondary">
                  <div>
                    <div className="font-bold text-foreground mb-1">{spot.grammar_tag}</div>
                    <div className="text-sm text-destructive font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive"></div>
                      {Math.round(spot.accuracy * 100)}% Genauigkeit ({spot.total_attempts} Versuche)
                    </div>
                  </div>
                  <Link href={`/grammar?tag=${encodeURIComponent(spot.grammar_tag)}`} className="text-primary hover:text-primary/80 font-bold text-sm bg-primary/10 px-4 py-2 rounded-xl">
                    Üben
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-correct/10 text-correct rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <p className="font-bold text-foreground text-lg mb-2">Alles im grünen Bereich!</p>
              <p className="text-muted-foreground text-sm">Du hast aktuell keine identifizierten Schwachstellen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}