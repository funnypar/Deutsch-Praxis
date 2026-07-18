import React, { useState } from 'react';
import { useGetDueSrsCards, useSubmitSrsReview, useListVocab, useEnqueueSrsVocab, getGetDueSrsCardsQueryKey, getListVocabQueryKey } from '@workspace/api-client-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookA, CheckCircle2, RotateCcw, Frown, Smile, GraduationCap, Search, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

function PracticeTab() {
  const { data, isLoading } = useGetDueSrsCards();
  const submitReview = useSubmitSrsReview();
  const queryClient = useQueryClient();
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = data?.cards || [];
  const totalDue = data?.total_due || 0;
  
  const currentCard = cards[currentIndex];

  const handleRating = (quality: number) => {
    if (!currentCard) return;
    
    submitReview.mutate(
      { data: { card_id: currentCard.id, quality } },
      {
        onSuccess: () => {
          setIsFlipped(false);
          if (currentIndex < cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            // End of batch, refetch
            setCurrentIndex(0);
            queryClient.invalidateQueries({ queryKey: getGetDueSrsCardsQueryKey() });
          }
        }
      }
    );
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;

  if (!currentCard) {
    return (
      <div className="text-center py-20 px-4 bg-correct/10 rounded-3xl border border-correct/20">
        <div className="inline-flex items-center justify-center p-4 bg-correct text-correct-foreground rounded-full mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Geschafft!</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">Du hast alle fälligen Vokabeln für heute wiederholt. Komm morgen wieder, um deinen Fortschritt zu sichern.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-serif font-bold text-foreground">Wortschatz-Training</h2>
        <div className="px-4 py-1.5 bg-accent/20 text-accent-foreground font-bold rounded-full text-sm flex items-center gap-2 border border-accent/20">
          <BookA className="w-4 h-4" />
          {totalDue - currentIndex} fällig
        </div>
      </div>

      <div className="relative h-96 mb-8 group perspective-1000">
        <div 
          className={`w-full h-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer rounded-3xl ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {/* Front (German) */}
          <div className="absolute inset-0 bg-card border-2 border-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 bg-secondary px-3 py-1 rounded-full">Deutsch</span>
            <h3 className="text-5xl font-serif font-bold text-primary text-center leading-tight">
              {currentCard.vocab_item?.german_word}
            </h3>
            <p className="mt-8 text-muted-foreground text-sm font-medium">Klicken zum Umdrehen</p>
          </div>

          {/* Back (Translation) */}
          <div className="absolute inset-0 bg-primary border-2 border-primary-border rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] text-primary-foreground">
            <span className="text-sm font-bold text-primary-foreground/70 uppercase tracking-widest mb-6 bg-black/20 px-3 py-1 rounded-full">Übersetzung</span>
            <h3 className="text-4xl font-bold text-center mb-6">
              {currentCard.vocab_item?.translation}
            </h3>
            {currentCard.vocab_item?.example_sentence && (
              <div className="mt-4 p-4 bg-black/10 rounded-xl text-center">
                <p className="text-lg italic opacity-90">"{currentCard.vocab_item.example_sentence}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <p className="text-center text-muted-foreground font-medium mb-4">Wie gut konntest du dich erinnern?</p>
        <div className="grid grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-1 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleRating(0)}
            disabled={submitReview.isPending}
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-xs">Nochmal</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-1 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
            onClick={() => handleRating(2)}
            disabled={submitReview.isPending}
          >
            <Frown className="w-5 h-5" />
            <span className="text-xs">Schwer</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-1 border-correct/30 hover:bg-correct/10 hover:text-correct"
            onClick={() => handleRating(4)}
            disabled={submitReview.isPending}
          >
            <Smile className="w-5 h-5" />
            <span className="text-xs">Gut</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center gap-1 border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600"
            onClick={() => handleRating(5)}
            disabled={submitReview.isPending}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs">Einfach</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function BrowseTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useListVocab({ search: search || undefined });
  const enqueueVocab = useEnqueueSrsVocab();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAdd = (id: number) => {
    enqueueVocab.mutate({ data: { vocab_item_id: id } }, {
      onSuccess: () => {
        toast({
          title: "Hinzugefügt!",
          description: "Die Vokabel wurde zu deinem Stapel hinzugefügt.",
        });
        queryClient.invalidateQueries({ queryKey: getGetDueSrsCardsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-foreground">Alle Vokabeln</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Suchen..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold text-primary">{item.german_word}</h4>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{item.cefr_level}</span>
                </div>
                <p className="text-foreground font-medium mb-2">{item.translation}</p>
                {item.example_sentence && (
                  <p className="text-sm text-muted-foreground italic">"{item.example_sentence}"</p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => handleAdd(item.id)}
                disabled={enqueueVocab.isPending}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Keine Vokabeln gefunden.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VocabTrainer() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Tabs defaultValue="practice" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="bg-card border border-border p-1 rounded-xl shadow-sm">
            <TabsTrigger value="practice" className="rounded-lg px-8 py-2.5 text-sm font-bold">Üben</TabsTrigger>
            <TabsTrigger value="browse" className="rounded-lg px-8 py-2.5 text-sm font-bold">Alle Vokabeln</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="practice" className="mt-0 focus-visible:outline-none">
          <PracticeTab />
        </TabsContent>
        
        <TabsContent value="browse" className="mt-0 focus-visible:outline-none">
          <BrowseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}