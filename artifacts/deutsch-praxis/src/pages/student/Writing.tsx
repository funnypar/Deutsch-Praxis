import React, { useState, useRef, useCallback } from 'react';
import { useListExercises, useGetMyProfile } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, PenTool, Send, ArrowRight, ChevronLeft, ChevronRight,
  Upload, FileText, RotateCcw, Lightbulb, CheckCircle2,
  AlertCircle, Target, BookOpen, Sparkles,
} from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL ?? '/';
const API_BASE = BASE_URL.replace(/\/$/, '');

interface EvaluationResult {
  score: number;
  word_count: number;
  sentence_count: number;
  avg_words_per_sentence: number;
  min_words: number;
  target_words: number;
  level_tips: string[];
  recommendations: string[];
  ai_feedback: null;
}

async function evaluateWriting(exercise_id: number, text: string): Promise<EvaluationResult> {
  const token = localStorage.getItem('dp_token');
  const res = await fetch(`${API_BASE}/api/writing/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ exercise_id, text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-600' :
    score >= 60 ? 'text-amber-500' :
    score >= 40 ? 'text-orange-500' : 'text-destructive';
  const ring =
    score >= 80 ? 'border-emerald-300 bg-emerald-50' :
    score >= 60 ? 'border-amber-300 bg-amber-50' :
    score >= 40 ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50';
  const label =
    score >= 80 ? 'Ausgezeichnet' :
    score >= 60 ? 'Gut' :
    score >= 40 ? 'Ausreichend' : 'Verbesserungsbedarf';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${ring}`}>
        <span className={`text-3xl font-bold tabular-nums ${color}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">/ 100</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{label}</span>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center bg-muted/50 rounded-2xl px-4 py-3 min-w-[80px]">
      <span className="text-lg font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function Writing() {
  const { data: profileData } = useGetMyProfile();
  const userLevel = profileData?.current_level ?? null;

  // Filter exercises by the user's level if known; otherwise show all
  const { data, isLoading } = useListExercises({ type: 'writing', cefr_level: userLevel ?? undefined });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const exercises = data?.exercises ?? [];
  const exercise = exercises[currentIndex];

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setError('Nur .txt-Dateien werden unterstützt.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content ?? '');
      setError(null);
      textareaRef.current?.focus();
    };
    reader.readAsText(file, 'UTF-8');
    // Reset so the same file can be re-imported
    e.target.value = '';
  }, []);

  const handleSubmit = async () => {
    if (!exercise || !text.trim()) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await evaluateWriting(exercise.id, text.trim());
      setResult(res);
    } catch (e: any) {
      setError('Fehler bei der Auswertung. Bitte versuche es erneut.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    setText('');
    setResult(null);
    setError(null);
    setCurrentIndex((i) => (i + 1) % exercises.length);
  };

  const handlePrev = () => {
    setText('');
    setResult(null);
    setError(null);
    setCurrentIndex((i) => (i - 1 + exercises.length) % exercises.length);
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin text-primary/50 w-8 h-8" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground mt-8">
          Keine Schreibübungen für dein Niveau gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: Prompt sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Prompt card */}
          <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-white/20">
                Niveau {exercise.cefr_level}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrev}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Vorherige Aufgabe"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="Nächste Aufgabe"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Thema</p>
            <h2 className="text-2xl font-serif font-bold mb-4 leading-tight">
              {exercise.prompt}
            </h2>

            {exercise.explanation && (
              <div className="pt-4 border-t border-white/20 space-y-1">
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide flex items-center gap-1.5">
                  <Target className="w-3 h-3" /> Aufgabe
                </p>
                <p className="text-sm opacity-90 leading-relaxed">{exercise.explanation}</p>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-white/20">
              <p className="text-xs opacity-60 tabular-nums">
                {currentIndex + 1} / {exercises.length} Aufgaben
              </p>
            </div>
          </div>

          {/* Tips card */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Tipps für {exercise.cefr_level}
            </p>
            <ul className="space-y-2">
              {(LEVEL_TIPS[exercise.cefr_level] ?? []).map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-snug">
                  <span className="text-primary font-bold mt-0.5 shrink-0">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right: Writing / Result area ── */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="tabular-nums font-mono">{wordCount} Wörter</span>
                  {exercise && (
                    <span className="text-muted-foreground/50">
                      · Ziel: {MIN_WORDS[exercise.cefr_level] ?? 50}+ Wörter
                    </span>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    .txt importieren
                  </Button>
                </div>
              </div>

              {/* Text area */}
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Schreibe hier deinen Text zum Thema „${exercise?.prompt}" …`}
                className="flex-1 min-h-[360px] resize-none border-0 rounded-none focus-visible:ring-0 text-base leading-relaxed p-6"
                autoFocus
              />

              {/* Progress bar toward target */}
              {exercise && (
                <div className="px-6 py-2">
                  <Progress
                    value={Math.min(100, (wordCount / (MIN_WORDS[exercise.cefr_level] ?? 50)) * 100)}
                    className="h-1.5 rounded-full"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4">
                {error && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
                {!error && <span />}
                <Button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isEvaluating}
                  className="rounded-xl px-8 h-12 text-base gap-2 shrink-0"
                >
                  {isEvaluating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Wird ausgewertet…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Einreichen & Auswerten</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* ── Result screen ── */
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-400">

              {/* Score + stats */}
              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={result.score} />
                <div className="flex-1 space-y-3 w-full">
                  <p className="text-sm font-semibold text-foreground">Deine Statistiken</p>
                  <div className="flex flex-wrap gap-3">
                    <StatPill label="Wörter" value={result.word_count} />
                    <StatPill label="Sätze" value={result.sentence_count} />
                    <StatPill label="Ø Wörter/Satz" value={result.avg_words_per_sentence} />
                    <StatPill label="Ziel" value={`${result.min_words}+`} />
                  </div>
                  <Progress
                    value={result.score}
                    className="h-2.5 rounded-full"
                  />
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Empfehlungen
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(KI-Auswertung folgt)</span>
                </p>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="mt-0.5 shrink-0">
                        {result.score >= 80
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </span>
                      <span className="text-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Level tips */}
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Tipps für Niveau {exercise.cefr_level}
                </p>
                <ul className="space-y-2">
                  {result.level_tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-900 leading-snug flex gap-2">
                      <span className="font-bold shrink-0">·</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* User's text (collapsed) */}
              <details className="bg-muted/40 border border-border rounded-3xl p-5">
                <summary className="text-sm font-semibold text-muted-foreground cursor-pointer select-none">
                  Dein Text anzeigen
                </summary>
                <p className="mt-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {text}
                </p>
              </details>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-1">
                <Button variant="outline" onClick={handleRetry} className="rounded-xl gap-2">
                  <RotateCcw className="w-4 h-4" /> Nochmal schreiben
                </Button>
                <Button onClick={handleNext} className="rounded-xl gap-2">
                  Nächste Aufgabe <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3 mb-1">
        <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
          <PenTool className="w-6 h-6" />
        </div>
        Schreiben
      </h1>
      <p className="text-muted-foreground text-sm">
        Wähle ein Thema · Schreibe frei · Erhalte Feedback
      </p>
    </div>
  );
}

const MIN_WORDS: Record<string, number> = {
  A1: 20, A2: 50, B1: 100, B2: 150, C1: 200,
};

const LEVEL_TIPS: Record<string, string[]> = {
  A1: [
    "Kurze, einfache Sätze: Subjekt + Verb + Objekt.",
    "Häufige Verben: sein, haben, gehen, machen.",
    "Achte auf: ich bin, du bist, er/sie ist.",
  ],
  A2: [
    "Verbinde Sätze mit: und, aber, weil, dann.",
    "Benutze das Perfekt für Vergangenes.",
    "Beschreibe mit Adjektiven: groß, schön, interessant.",
  ],
  B1: [
    "Gliedere: Einleitung → Hauptteil → Schluss.",
    "Drücke deine Meinung aus: Ich finde, dass…",
    "Verwende Zeitformen: Präsens, Perfekt, Futur.",
  ],
  B2: [
    "Konjunktiv II für Hypothesen: würde, könnte.",
    "Argumentiere pro und contra mit Beispielen.",
    "Nutze Relativsätze und Infinitivkonstruktionen.",
  ],
  C1: [
    "Variiere Satzbau und Stilebene bewusst.",
    "Setze Passiv und Partizipialkonstruktionen ein.",
    "Belege Argumente mit konkreten Fakten oder Zitaten.",
  ],
};
