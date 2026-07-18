import React, { useState } from 'react';
import { useListExercises, useCreateExercise, useUpdateExercise, useDeleteExercise, Exercise, ExerciseType, ExerciseCefrLevel, getListExercisesQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function AdminExercises() {
  const { data, isLoading } = useListExercises();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    type: 'grammar' as ExerciseType,
    cefr_level: 'A1' as ExerciseCefrLevel,
    grammar_tag: '',
    prompt: '',
    options: '', // JSON string for form
    correct_answer: '',
    explanation: '',
    audio_url: '',
  });

  const exercises = data?.exercises || [];
  const filtered = exercises.filter(e => e.prompt.toLowerCase().includes(search.toLowerCase()) || e.grammar_tag?.toLowerCase().includes(search.toLowerCase()));

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      type: 'grammar', cefr_level: 'A1', grammar_tag: '', prompt: '', options: '', correct_answer: '', explanation: '', audio_url: ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setFormData({
      type: exercise.type,
      cefr_level: exercise.cefr_level,
      grammar_tag: exercise.grammar_tag || '',
      prompt: exercise.prompt,
      options: exercise.options ? JSON.stringify(exercise.options, null, 2) : '',
      correct_answer: exercise.correct_answer,
      explanation: exercise.explanation || '',
      audio_url: exercise.audio_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Wirklich löschen?')) return;
    deleteExercise.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Gelöscht', description: 'Übung wurde entfernt.' });
        queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedOptions = undefined;
    if (formData.options.trim()) {
      try {
        parsedOptions = JSON.parse(formData.options);
      } catch (err) {
        toast({ title: 'JSON Fehler', description: 'Optionen müssen gültiges JSON sein.', variant: 'destructive' });
        return;
      }
    }

    const payload = {
      ...formData,
      options: parsedOptions,
      grammar_tag: formData.grammar_tag || undefined,
      explanation: formData.explanation || undefined,
      audio_url: formData.audio_url || undefined,
    };

    if (editingId) {
      updateExercise.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: 'Aktualisiert' });
          queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
        }
      });
    } else {
      createExercise.mutate({ data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: 'Erstellt' });
          queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Übungen</h1>
          <p className="text-muted-foreground">Verwalte alle Aufgaben der Plattform.</p>
        </div>
        <Button onClick={handleOpenNew} className="rounded-xl">
          <Plus className="w-5 h-5 mr-2" /> Neue Übung
        </Button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Suchen..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Thema</TableHead>
                  <TableHead className="w-1/3">Aufgabe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ex => (
                  <TableRow key={ex.id}>
                    <TableCell className="capitalize"><span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-bold">{ex.type}</span></TableCell>
                    <TableCell className="font-bold text-primary">{ex.cefr_level}</TableCell>
                    <TableCell>{ex.grammar_tag || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{ex.prompt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(ex)} className="text-muted-foreground hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Keine Übungen gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Übung bearbeiten' : 'Neue Übung erstellen'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammatik</SelectItem>
                    <SelectItem value="vocab">Wortschatz</SelectItem>
                    <SelectItem value="listening">Hören</SelectItem>
                    <SelectItem value="writing">Schreiben</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau</Label>
                <Select value={formData.cefr_level} onValueChange={(v: any) => setFormData({...formData, cefr_level: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Grammatik-Thema (optional)</Label>
              <Input value={formData.grammar_tag} onChange={e => setFormData({...formData, grammar_tag: e.target.value})} placeholder="z.B. Perfekt, Dativ..." />
            </div>

            <div className="space-y-2">
              <Label>Aufgabe / Prompt</Label>
              <Textarea value={formData.prompt} onChange={e => setFormData({...formData, prompt: e.target.value})} required rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Korrekte Antwort</Label>
              <Input value={formData.correct_answer} onChange={e => setFormData({...formData, correct_answer: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Optionen (JSON, optional)</Label>
              <Textarea 
                value={formData.options} 
                onChange={e => setFormData({...formData, options: e.target.value})} 
                placeholder='{"choices": ["A", "B", "C"]}'
                className="font-mono text-sm"
                rows={3} 
              />
            </div>

            <div className="space-y-2">
              <Label>Erklärung bei Fehler (optional)</Label>
              <Textarea value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Audio URL oder TTS-Text (optional)</Label>
              <Input value={formData.audio_url} onChange={e => setFormData({...formData, audio_url: e.target.value})} />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={createExercise.isPending || updateExercise.isPending}>
                {(createExercise.isPending || updateExercise.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}