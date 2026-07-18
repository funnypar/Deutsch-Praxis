import React, { useState } from 'react';
import { useListClasses, useCreateClass, useDeleteClass, useAddClassMember, useRemoveClassMember, useGetClass, getListClassesQueryKey, getGetClassQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Users, UserMinus, Trash2, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

function ClassDetailModal({ classId, isOpen, onClose }: { classId: number | null, isOpen: boolean, onClose: () => void }) {
  const { data, isLoading } = useGetClass(classId!, { query: { enabled: !!classId && isOpen } });
  const addMember = useAddClassMember();
  const removeMember = useRemoveClassMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !email) return;
    addMember.mutate({ id: classId, data: { student_email: email } }, {
      onSuccess: () => {
        toast({ title: 'Schüler hinzugefügt' });
        setEmail('');
        queryClient.invalidateQueries({ queryKey: getGetClassQueryKey(classId) });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
      }
    });
  };

  const handleRemove = (studentId: number) => {
    if (!classId) return;
    removeMember.mutate({ id: classId, data: { student_id: studentId } as any }, {
      onSuccess: () => {
        toast({ title: 'Schüler entfernt' });
        queryClient.invalidateQueries({ queryKey: getGetClassQueryKey(classId) });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{data ? data.name : 'Klasse laden...'}</DialogTitle>
          <DialogDescription>Verwalte die Mitglieder dieser Klasse.</DialogDescription>
        </DialogHeader>
        
        {isLoading || !data ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>
        ) : (
          <div className="flex flex-col gap-6 overflow-hidden">
            <form onSubmit={handleAdd} className="flex gap-2 shrink-0">
              <Input 
                placeholder="E-Mail des Schülers..." 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hinzufügen'}
              </Button>
            </form>

            <div className="overflow-y-auto border border-border rounded-xl">
              {data.members && data.members.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.members.map(member => (
                    <div key={member.id} className="p-3 flex items-center justify-between hover:bg-muted/20">
                      <div>
                        <div className="font-bold text-sm text-foreground">{member.display_name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{member.current_level || 'N/A'}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(member.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Keine Schüler in dieser Klasse.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminClasses() {
  const { data, isLoading } = useListClasses();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const classes = data?.classes || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClass.mutate({ data: { name: newClassName } }, {
      onSuccess: () => {
        toast({ title: 'Klasse erstellt' });
        setNewClassName('');
        setIsNewOpen(false);
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Klasse wirklich löschen? Alle Zuweisungen werden entfernt.')) return;
    deleteClass.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Klasse gelöscht' });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Klassen</h1>
          <p className="text-muted-foreground">Gruppiere Schüler für einfache Zuweisungen.</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="rounded-xl">
          <Plus className="w-5 h-5 mr-2" /> Neue Klasse
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div 
              key={cls.id} 
              className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => setSelectedClassId(cls.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-8 w-8 transition-opacity"
                  onClick={(e) => handleDelete(e, cls.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{cls.name}</h3>
              <p className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>{cls.member_count || 0} Mitglieder</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
              </p>
            </div>
          ))}

          {classes.length === 0 && (
            <div className="col-span-full bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
              Du hast noch keine Klassen angelegt.
            </div>
          )}
        </div>
      )}

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Neue Klasse erstellen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name der Klasse</Label>
              <Input 
                value={newClassName} 
                onChange={e => setNewClassName(e.target.value)} 
                placeholder="z.B. Deutsch B1 - Abendkurs" 
                required 
                autoFocus
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={createClass.isPending}>
                {createClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClassDetailModal 
        classId={selectedClassId} 
        isOpen={selectedClassId !== null} 
        onClose={() => setSelectedClassId(null)} 
      />
    </div>
  );
}