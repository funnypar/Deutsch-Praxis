import React, { useState, useRef, useCallback } from 'react';
import { useListExercises } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Headphones, Play, Square, Download,
  CheckCircle2, XCircle, ArrowRight, ChevronLeft, ChevronRight,
  Volume2, FileText,
} from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL ?? '/';
const API_BASE = BASE_URL.replace(/\/$/, '');

async function scoreAnswer(exercise_id: number, user_text: string) {
  const token = localStorage.getItem('dp_token');
  const res = await fetch(`${API_BASE}/api/listening/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ exercise_id, user_text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    score: number;
    passed: boolean;
    feedback: string;
    source_text: string | null;
  }>;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-destructive';
  const bg =
    score >= 70 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  return (
    <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${bg}`}>
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground font-medium">/ 100</span>
    </div>
  );
}

export default function Listening() {
  const { data, isLoading } = useListExercises({ type: 'listening' });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userText, setUserText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback: string;
    source_text: string | null;
  } | null>(null);
  const [playCount, setPlayCount] = useState(0);

  const exercises = data?.exercises ?? [];
  const exercise = exercises[currentIndex];

  const speakText = useCallback(() => {
    if (!exercise) return;
    window.speechSynthesis.cancel();
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    const text = exercise.audio_url ?? exercise.prompt;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.85;
    utterance.pitch = 1;

    // Prefer a German voice if available
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find((v) => v.lang.startsWith('de'));
    if (germanVoice) utterance.voice = germanVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      setHasListened(true);
      setPlayCount((c) => c + 1);
    };
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [exercise, isPlaying]);

  const handleSubmit = async () => {
    if (!exercise || !userText.trim()) return;
    setIsScoring(true);
    try {
      const res = await scoreAnswer(exercise.id, userText.trim());
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScoring(false);
    }
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setHasListened(false);
    setUserText('');
    setResult(null);
    setPlayCount(0);
    setCurrentIndex((i) => (i + 1) % exercises.length);
  };

  const handlePrev = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setHasListened(false);
    setUserText('');
    setResult(null);
    setPlayCount(0);
    setCurrentIndex((i) => (i - 1 + exercises.length) % exercises.length);
  };

  React.useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="animate-spin text-primary/50 w-8 h-8" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader />
        <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
          Keine Hörverständnis-Übungen gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <PageHeader />

      {/* Progress breadcrumb */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-muted-foreground">
          Übung {currentIndex + 1} von {exercises.length}
        </span>
        <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-primary/10 text-primary">
          {exercise?.cefr_level}
        </span>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">

        {/* ── Audio Zone ── */}
        <div className="bg-gradient-to-br from-primary/8 to-primary/3 p-10 flex flex-col items-center gap-5 border-b border-border">
          <p className="text-sm text-muted-foreground text-center">
            Höre dir den Text an und schreibe danach, was du verstanden hast.
          </p>

          {/* Big play button */}
          <div className="relative">
            {isPlaying && (
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            )}
            <Button
              onClick={speakText}
              className="w-24 h-24 rounded-full shadow-lg hover:scale-105 transition-transform text-white"
              aria-label={isPlaying ? 'Stop' : 'Abspielen'}
            >
              {isPlaying
                ? <Square className="w-9 h-9 fill-current" />
                : <Play className="w-9 h-9 ml-1 fill-current" />}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-muted-foreground">
              {isPlaying ? 'Spielt ab…' : hasListened ? `Abgespielt (${playCount}×)` : 'Klicke auf Play, um zu hören'}
            </p>
            {!result && (
              <p className="text-xs text-muted-foreground/60">
                Du kannst den Text so oft anhören, wie du möchtest.
              </p>
            )}
          </div>
        </div>

        {/* ── Answer Zone ── */}
        {!result ? (
          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Deine Zusammenfassung
              </label>
              <Textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Schreibe hier, was du verstanden hast – auf Deutsch oder Englisch…"
                className="min-h-[140px] resize-none rounded-2xl text-base leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {userText.trim().split(/\s+/).filter(Boolean).length} Wörter
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handlePrev} className="rounded-xl">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext} className="rounded-xl">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!userText.trim() || isScoring}
                className="rounded-xl h-12 px-8 text-base"
              >
                {isScoring
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Auswerten…</>
                  : 'Absenden & Auswerten'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── Result Zone ── */
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">

            {/* Score + status */}
            <div className="flex items-center gap-6">
              <ScoreRing score={result.score} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {result.passed
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <XCircle className="w-5 h-5 text-destructive" />}
                  <span className={`font-bold text-lg ${result.passed ? 'text-emerald-700' : 'text-destructive'}`}>
                    {result.passed ? 'Bestanden!' : 'Noch nicht bestanden'}
                  </span>
                </div>
                <Progress
                  value={result.score}
                  className="h-3 rounded-full"
                />
                <p className="text-sm text-muted-foreground">{result.feedback}</p>
              </div>
            </div>

            {/* What user wrote */}
            <div className="bg-muted/40 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Deine Antwort</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{userText}</p>
            </div>

            {/* Transcript (only if passed) */}
            {result.passed && result.source_text && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-emerald-700 tracking-wide flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" />
                    Originaltext
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-100 gap-2"
                    onClick={() =>
                      downloadText(
                        result.source_text!,
                        `hoertext-${exercise?.cefr_level ?? 'de'}.txt`
                      )
                    }
                  >
                    <Download className="w-4 h-4" />
                    Text herunterladen
                  </Button>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">{result.source_text}</p>
              </div>
            )}

            {/* Locked message if not passed */}
            {!result.passed && (
              <div className="bg-muted/40 border border-dashed border-border rounded-2xl p-4 text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Erreiche 70+ Punkte, um den Originaltext herunterzuladen.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Höre den Text erneut an und versuche mehr Schlüsselwörter zu erfassen.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl gap-2">
                Nochmal versuchen
              </Button>
              <Button onClick={handleNext} className="rounded-xl gap-2">
                Nächste Übung
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3 mb-1">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
          <Headphones className="w-6 h-6" />
        </div>
        Hörverstehen
      </h1>
      <p className="text-muted-foreground text-sm">
        Höre zu · Verstehe · Schreibe · Bestehe
      </p>
    </div>
  );
}
