import React, { useState } from 'react';
import { useListExercises, useRecordProgress, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, XCircle, ArrowRight, ListTree, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

export default function GrammarDrills() {
  const [level, setLevel] = useState<string>('all');
  const [tag, setTag] = useState<string>('all');
  
  const { data, isLoading } = useListExercises({ 
    type: 'grammar', 
    cefr_level: level !== 'all' ? level as any : undefined,
    grammar_tag: tag !== 'all' ? tag : undefined
  });
  
  const recordProgress = useRecordProgress();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const exercises = data?.exercises || [];
  const currentExercise = exercises[currentIndex];

  // Derive unique tags from data for the filter
  const allTags = Array.from(new Set(exercises.map(e => e.grammar_tag).filter(Boolean)));

  const handleCheck = () => {
    if (!currentExercise || !answer.trim()) return;

    const isCorrect = answer.trim().toLowerCase() === currentExercise.correct_answer.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    recordProgress.mutate(
      { data: { exercise_id: currentExercise.id, correct: isCorrect } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      }
    );
  };

  const handleNext = () => {
    setFeedback(null);
    setAnswer('');
    setCurrentIndex(prev => (prev + 1) % exercises.length);
  };

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <ListTree className="w-6 h-6" />
            </div>
            Grammatik-Drill
          </h1>
          <p className="text-muted-foreground mt-2">Festige deine grammatikalischen Strukturen.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-2 rounded-xl border border-border">
          <Filter className="w-4 h-4 text-muted-foreground ml-2" />
          <Select value={level} onValueChange={(v) => { setLevel(v); setCurrentIndex(0); setFeedback(null); setAnswer(''); }}>
            <SelectTrigger className="w-24 border-0 bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="A1">A1</SelectItem>
              <SelectItem value="A2">A2</SelectItem>
              <SelectItem value="B1">B1</SelectItem>
              <SelectItem value="B2">B2</SelectItem>
              <SelectItem value="C1">C1</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-px h-6 bg-border"></div>
          <Select value={tag} onValueChange={(v) => { setTag(v); setCurrentIndex(0); setFeedback(null); setAnswer(''); }}>
            <SelectTrigger className="w-32 border-0 bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Thema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Themen</SelectItem>
              {allTags.map(t => (
                <SelectItem key={t as string} value={t as string}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
          Keine Übungen für diese Filterkombination gefunden.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          
          <div className="p-8 md:p-10 border-b border-border relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                {currentExercise.cefr_level}
              </span>
              {currentExercise.grammar_tag && (
                <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {currentExercise.grammar_tag}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-serif font-bold text-foreground mb-8 mt-4 leading-relaxed">
              {currentExercise.prompt}
            </h2>

            {/* Multiple Choice or Text Input */}
            {currentExercise.options && Array.isArray(currentExercise.options.choices) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(currentExercise.options.choices as string[]).map((choice, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className={`h-auto py-4 text-left justify-start text-lg font-medium whitespace-normal ${
                      answer === choice 
                        ? feedback === 'correct' 
                          ? 'border-correct bg-correct/10 text-correct hover:bg-correct/10 hover:text-correct'
                          : feedback === 'incorrect'
                            ? 'border-destructive bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive'
                            : 'border-primary bg-primary/5 text-primary hover:bg-primary/5'
                        : feedback && choice === currentExercise.correct_answer
                          ? 'border-correct bg-correct/10 text-correct hover:bg-correct/10 hover:text-correct'
                          : 'hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                    onClick={() => !feedback && setAnswer(choice)}
                    disabled={feedback !== null}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="max-w-md">
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Deine Antwort..."
                  className={`text-lg py-6 ${
                    feedback === 'correct' 
                      ? 'border-correct focus-visible:ring-correct' 
                      : feedback === 'incorrect' 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : ''
                  }`}
                  disabled={feedback !== null}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !feedback) handleCheck();
                  }}
                />
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              {feedback === 'correct' && (
                <div className="flex items-center gap-2 text-correct font-bold animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Richtig! Sehr gut gemacht.
                </div>
              )}
              {feedback === 'incorrect' && (
                <div className="animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-center gap-2 text-destructive font-bold mb-1">
                    <XCircle className="w-6 h-6" />
                    Leider falsch.
                  </div>
                  {currentExercise.explanation && (
                    <p className="text-sm text-foreground bg-white dark:bg-black/20 p-3 rounded-xl border border-destructive/20 mt-3 shadow-sm inline-block">
                      <span className="font-bold mr-2 text-destructive">Tipp:</span>
                      {currentExercise.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {!feedback ? (
                <Button 
                  onClick={handleCheck} 
                  disabled={!answer.trim() || recordProgress.isPending}
                  className="w-full sm:w-auto rounded-xl h-12 px-8 text-lg"
                >
                  Überprüfen
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="w-full sm:w-auto rounded-xl h-12 px-8 text-lg"
                >
                  Weiter
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}