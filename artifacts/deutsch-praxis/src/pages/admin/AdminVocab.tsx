import React, { useState } from 'react';
import { useListVocab, useCreateVocabItem, useUpdateVocabItem, useDeleteVocabItem, VocabItem, VocabItemCefrLevel, getListVocabQueryKey } from '@workspace/api-client-react';
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

export default function AdminVocab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useListVocab({ search: search || undefined });
  const createItem = useCreateVocabItem();
  const updateItem = useUpdateVocabItem();
  const deleteItem = useDeleteVocabItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    german_word: '',
    translation: '',
    cefr_level: 'A1' as VocabItemCefrLevel,
    example_sentence: '',
    tags: '',
  });

  const items = data?.items || [];

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ german_word: '', translation: '', cefr_level: 'A1', example_sentence: '', tags: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: VocabItem) => {
    setEditingId(item.id);
    setFormData({
      german_word: item.german_word,
      translation: item.translation,
      cefr_level: item.cefr_level,
      example_sentence: item.example_sentence || '',
      tags: item.tags ? item.tags.join(', ') : '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Wirklich löschen?')) return;
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Gelöscht' });
        queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
      example_sentence: formData.example_sentence || undefined,
    };

    if (editingId) {
      updateItem.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: 'Aktualisiert' });
          queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
        }
      });
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          toast({ title: 'Erstellt' });
          queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Wortschatz</h1>
          <p className="text-muted-foreground">Verwalte das globale Vokabular.</p>
        </div>
        <Button onClick={handleOpenNew} className="rounded-xl">
          <Plus className="w-5 h-5 mr-2" /> Neue Vokabel
        </Button>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Suchen nach Deutsch oder Übersetzung..." 
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
                  <TableHead>Niveau</TableHead>
                  <TableHead>Deutsch</TableHead>
                  <TableHead>Übersetzung</TableHead>
                  <TableHead>Beispiel / Tags</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell><span className="font-bold text-primary">{item.cefr_level}</span></TableCell>
                    <TableCell className="font-bold">{item.german_word}</TableCell>
                    <TableCell>{item.translation}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div className="text-xs text-muted-foreground italic truncate mb-1">{item.example_sentence}</div>
                      <div className="flex gap-1 flex-wrap">
                        {item.tags?.map(t => <span key={t} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{t}</span>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)} className="text-muted-foreground hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Keine Vokabeln gefunden.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Vokabel bearbeiten' : 'Neue Vokabel erstellen'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deutsches Wort</Label>
                <Input value={formData.german_word} onChange={e => setFormData({...formData, german_word: e.target.value})} required />
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
              <Label>Übersetzung</Label>
              <Input value={formData.translation} onChange={e => setFormData({...formData, translation: e.target.value})} required />
            </div>

            <div className="space-y-2">
              <Label>Beispielsatz (optional)</Label>
              <Textarea value={formData.example_sentence} onChange={e => setFormData({...formData, example_sentence: e.target.value})} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Tags (kommagetrennt, optional)</Label>
              <Input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="z.B. Nomen, Essen, Haus..." />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}