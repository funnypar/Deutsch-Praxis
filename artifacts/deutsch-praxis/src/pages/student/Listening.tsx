import React, { useState, useRef } from 'react';
import { useListExercises, useRecordProgress } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Loader2, Headphones, Play, Square, CheckCircle2, XCircle, ArrowRight, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Listening() {
  const { data, isLoading } = useListExercises({ type: 'listening' });
  const recordProgress = useRecordProgress();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const exercises = data?.exercises || [];
  const currentExercise = exercises[currentIndex];

  const handlePlayAudio = () => {
    if (!currentExercise) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Determine text to read: usually prompt or audio_url if it's text
    // Assuming audio_url contains the text to synthesize if it's not a real URL
    const textToRead = currentExercise.audio_url || currentExercise.prompt;
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9; // Slightly slower for learning
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleCheck = () => {
    if (!currentExercise || !answer.trim()) return;

    const isCorrect = answer === currentExercise.correct_answer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    recordProgress.mutate(
      { data: { exercise_id: currentExercise.id, correct: isCorrect } }
    );
  };

  const handleNext = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setFeedback(null);
    setAnswer('');
    setShowTranscript(false);
    setCurrentIndex(prev => (prev + 1) % exercises.length);
  };

  // Stop audio if unmounted
  React.useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  if (exercises.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
            <Headphones className="w-6 h-6" />
          </div>
          Hörverstehen
        </h1>
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
          Keine Hörverständnis-Übungen gefunden.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
          <Headphones className="w-6 h-6" />
        </div>
        Hörverstehen
      </h1>
      <p className="text-muted-foreground mb-8">Höre dir den Text an und beantworte die Frage.</p>

      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden mb-6">
        {/* Audio Player Area */}
        <div className="bg-primary/5 p-12 flex flex-col items-center justify-center border-b border-border relative">
          <span className="absolute top-4 right-4 text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-primary/20 text-primary">
            {currentExercise.cefr_level}
          </span>
          
          <div className="w-32 h-32 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
            {isPlaying && (
              <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-full" />
            )}
            <Button
              variant="default"
              size="icon"
              className="w-20 h-20 rounded-full shadow-lg hover:scale-105 transition-transform"
              onClick={handlePlayAudio}
            >
              {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-2 fill-current" />}
            </Button>
          </div>
          <p className="text-muted-foreground font-medium">
            {isPlaying ? 'Spielt ab...' : 'Klicke auf Play, um den Text zu hören'}
          </p>

          {showTranscript && (
            <div className="mt-8 w-full max-w-lg bg-background p-6 rounded-2xl border border-border text-foreground leading-relaxed animate-in fade-in slide-in-from-top-2">
              {currentExercise.audio_url || currentExercise.prompt}
            </div>
          )}
        </div>

        {/* Question Area */}
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-serif font-bold text-foreground">
              {currentExercise.prompt}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-muted-foreground hover:text-primary -mt-1 shrink-0"
            >
              <FileText className="w-4 h-4 mr-2" />
              {showTranscript ? 'Text ausblenden' : 'Text anzeigen'}
            </Button>
          </div>

          {currentExercise.options && Array.isArray(currentExercise.options.choices) && (
            <div className="grid grid-cols-1 gap-3">
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
          )}
        </div>

        {/* Action Area */}
        <div className="bg-muted/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
          <div className="flex-1">
            {feedback === 'correct' && (
              <div className="flex items-center gap-2 text-correct font-bold animate-in fade-in slide-in-from-left-2">
                <CheckCircle2 className="w-6 h-6" />
                Richtig! Gut zugehört.
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="flex items-center gap-2 text-destructive font-bold animate-in fade-in slide-in-from-left-2">
                <XCircle className="w-6 h-6" />
                Leider falsch.
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
    </div>
  );
}