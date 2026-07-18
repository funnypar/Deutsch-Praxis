import React, { useState } from 'react';
import { useListExercises, useRecordProgress } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Loader2, PenTool, Send, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Writing() {
  const { data, isLoading } = useListExercises({ type: 'writing' });
  const recordProgress = useRecordProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const exercises = data?.exercises || [];
  const currentExercise = exercises[currentIndex];

  const handleSubmit = () => {
    if (!currentExercise || !text.trim()) return;

    recordProgress.mutate(
      { data: { exercise_id: currentExercise.id, correct: true } }, // Mark as correct for now, placeholder for real feedback
      {
        onSuccess: () => {
          setSubmitted(true);
        }
      }
    );
  };

  const handleNext = () => {
    setSubmitted(false);
    setText('');
    setCurrentIndex(prev => (prev + 1) % exercises.length);
  };

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
            <PenTool className="w-6 h-6" />
          </div>
          Schreiben
        </h1>
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
          Keine Schreibübungen gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
        <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
          <PenTool className="w-6 h-6" />
        </div>
        Schreiben
      </h1>
      <p className="text-muted-foreground mb-8">Übe deinen schriftlichen Ausdruck. Schreib frei auf Deutsch.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Prompt Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-md sticky top-24">
            <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-white/20 mb-4 inline-block">
              Niveau {currentExercise.cefr_level}
            </span>
            <h2 className="text-xl font-serif font-bold mb-4">Aufgabe:</h2>
            <p className="text-primary-foreground/90 text-lg leading-relaxed">
              {currentExercise.prompt}
            </p>
            {currentExercise.explanation && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-primary-foreground/70 font-medium mb-1">Worauf du achten solltest:</p>
                <p className="text-sm opacity-90">{currentExercise.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Writing Area */}
        <div className="lg:col-span-2">
          {!submitted ? (
            <div className="bg-card border border-border rounded-3xl shadow-sm p-6 md:p-8 flex flex-col h-[500px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Fang hier an zu schreiben..."
                className="flex-1 w-full resize-none outline-none bg-transparent text-lg text-foreground placeholder:text-muted-foreground/50 mb-4"
                autoFocus
              />
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground font-mono">
                  {text.trim().split(/\s+/).filter(w => w.length > 0).length} Wörter
                </span>
                <Button 
                  onClick={handleSubmit}
                  disabled={!text.trim() || recordProgress.isPending}
                  className="rounded-xl px-8 h-12 text-base shadow-md"
                >
                  {recordProgress.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Einreichen <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl shadow-sm p-12 flex flex-col items-center justify-center text-center h-[500px] animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-correct/10 text-correct rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Text eingereicht!</h2>
              <p className="text-muted-foreground max-w-sm mb-8 text-lg">
                Dein Text wurde erfolgreich zur Überprüfung gespeichert. Gut gemacht!
              </p>
              
              <div className="p-6 bg-muted/30 rounded-2xl mb-8 w-full max-w-md border border-border text-left">
                <p className="text-sm text-muted-foreground font-bold mb-2 uppercase tracking-wider">Dein Text</p>
                <p className="text-foreground line-clamp-3 italic opacity-80">"{text}"</p>
              </div>

              <Button onClick={handleNext} className="rounded-xl px-8 h-12 text-base">
                Nächste Aufgabe <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}