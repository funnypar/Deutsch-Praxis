import React, { useState } from 'react';
import { useListClasses, useGetClassAnalytics } from '@workspace/api-client-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, BarChart3, AlertCircle } from 'lucide-react';

export default function AdminAnalytics() {
  const { data: classesData, isLoading: isLoadingClasses } = useListClasses();
  const classes = classesData?.classes || [];
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Set default class if available and none selected
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id.toString());
    }
  }, [classes, selectedClassId]);

  const { data: analytics, isLoading: isLoadingAnalytics } = useGetClassAnalytics(
    Number(selectedClassId), 
    { query: { enabled: !!selectedClassId } }
  );

  if (isLoadingClasses) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>;
  }

  if (classes.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Klassen-Analysen</h1>
        <div className="bg-card border border-border border-dashed rounded-3xl p-12 text-center text-muted-foreground">
          Bitte erstelle zuerst eine Klasse und füge Schüler hinzu.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
            Analysen
          </h1>
          <p className="text-muted-foreground mt-1">Verfolge den Lernfortschritt deiner Schüler.</p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedClassId || ''} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full bg-card">
              <SelectValue placeholder="Klasse wählen..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {isLoadingAnalytics ? (
          <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-primary/50 w-8 h-8" /></div>
        ) : !analytics || analytics.students.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Keine Daten für diese Klasse gefunden. Füge Schüler hinzu, damit diese üben können.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Schüler</TableHead>
                  <TableHead>Genauigkeit</TableHead>
                  <TableHead>Übungen</TableHead>
                  <TableHead>Letzte Aktivität</TableHead>
                  <TableHead>Häufige Fehler (Themen)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.students.map((student) => {
                  const acc = Math.round(student.accuracy * 100);
                  const isStruggling = acc < 60 && student.total_attempts > 5;
                  
                  return (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          {student.display_name}
                          {isStruggling && <AlertCircle className="w-4 h-4 text-destructive" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${acc >= 80 ? 'text-correct' : acc >= 60 ? 'text-primary' : 'text-destructive'}`}>
                            {acc}%
                          </span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${acc >= 80 ? 'bg-correct' : acc >= 60 ? 'bg-primary' : 'bg-destructive'}`} 
                              style={{ width: `${acc}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {student.total_attempts} Versuche
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.last_active ? new Date(student.last_active).toLocaleDateString('de-DE') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.weak_spots?.slice(0, 2).map((spot, i) => (
                            <span key={i} className="text-[10px] bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded">
                              {spot.grammar_tag} ({Math.round(spot.accuracy * 100)}%)
                            </span>
                          ))}
                          {(!student.weak_spots || student.weak_spots.length === 0) && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}