import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useLogin, useRegister, useGetMe } from '@workspace/api-client-react';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');

  const { refetch: refetchMe } = useGetMe({ query: { enabled: false } });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('A1');

  const handleAuthSuccess = async (token: string, redirectPath: string) => {
    localStorage.setItem('dp_token', token);
    await refetchMe();
    setLocation(redirectPath);
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        handleAuthSuccess(data.token, data.user.role === 'teacher' ? '/admin' : '/');
      },
      onError: (err: any) => {
        toast({
          title: "Fehler",
          description: err.message || "Anmeldung fehlgeschlagen",
          variant: "destructive",
        });
      }
    });
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      data: {
        email,
        password,
        display_name: displayName,
        role,
        current_level: role === 'student' ? level : undefined,
      }
    }, {
      onSuccess: (data) => {
        handleAuthSuccess(data.token, data.user.role === 'teacher' ? '/admin' : '/');
      },
      onError: (err: any) => {
        toast({
          title: "Fehler",
          description: err.message || "Registrierung fehlgeschlagen",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl mb-4 text-primary-foreground shadow-lg">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">DeutschPraxis</h1>
          <p className="text-muted-foreground font-medium">Dein Raum für besseres Deutsch</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6 pb-2 border-b border-border bg-muted/20">
              <TabsList className="w-full grid grid-cols-2 bg-muted">
                <TabsTrigger value="login" className="rounded-lg">Anmelden</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg">Registrieren</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="login" className="mt-0">
                <form onSubmit={onLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login">E-Mail</Label>
                    <Input 
                      id="email-login" 
                      type="email" 
                      placeholder="deine@email.de" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login">Passwort</Label>
                    <Input 
                      id="password-login" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      className="bg-background"
                    />
                  </div>
                  <Button type="submit" className="w-full mt-4 rounded-xl text-lg h-12" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Los geht\'s'}
                    {!loginMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={onRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Dein Name" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required 
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-reg">E-Mail</Label>
                    <Input 
                      id="email-reg" 
                      type="email" 
                      placeholder="deine@email.de" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-reg">Passwort (min. 8 Zeichen)</Label>
                    <Input 
                      id="password-reg" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      minLength={8}
                      className="bg-background"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ich bin...</Label>
                      <Select value={role} onValueChange={(val: any) => setRole(val)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Lernende/r</SelectItem>
                          <SelectItem value="teacher">Lehrkraft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {role === 'student' && (
                      <div className="space-y-2">
                        <Label>Niveau</Label>
                        <Select value={level} onValueChange={(val: any) => setLevel(val)}>
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A1">A1</SelectItem>
                            <SelectItem value="A2">A2</SelectItem>
                            <SelectItem value="B1">B1</SelectItem>
                            <SelectItem value="B2">B2</SelectItem>
                            <SelectItem value="C1">C1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-4 rounded-xl text-lg h-12" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Konto erstellen'}
                    {!registerMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}