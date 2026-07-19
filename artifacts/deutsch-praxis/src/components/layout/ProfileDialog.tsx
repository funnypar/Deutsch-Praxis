import React, { useRef, useState, useEffect } from 'react';
import { useUpdateMyProfile, useGetMe } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/context/LangContext';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: user } = useGetMe();
  const updateProfile = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLang();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [level, setLevel] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.display_name ?? '');
      setLevel(user.current_level ?? '');
      setAvatarPreview(user.avatar_url ?? null);
      setAvatarChanged(false);
    }
  }, [open, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: t('imageError'), description: t('imageErrorDesc'), variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t('imageSizeError'), description: t('imageSizeErrorDesc'), variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      setAvatarChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: t('nameRequired'), description: t('nameRequiredDesc'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: { display_name?: string; current_level?: any; avatar_url?: string | null } = {
        display_name: displayName.trim(),
      };
      if (level) payload.current_level = level as any;
      if (avatarChanged) payload.avatar_url = avatarPreview;

      await updateProfile.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/profiles/me'] });
      toast({ title: t('saved'), description: t('savedDesc') });
      onOpenChange(false);
    } catch {
      toast({ title: t('saveError'), description: t('saveErrorDesc'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || user?.display_name || '??').substring(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-primary text-xl">{t('editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-secondary shadow-md">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={displayName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-serif text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {t('uploadImage')}
              </Button>
              {avatarPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('removeImage')}
                </Button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <p className="text-xs text-muted-foreground">{t('imageHint')}</p>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">{t('displayName')}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background" maxLength={60} />
          </div>

          {/* Niveau — students only */}
          {user?.role === 'student' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">{t('niveau')}</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t('chooseNiveau')} />
                </SelectTrigger>
                <SelectContent>
                  {CEFR_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('niveauHint')}</p>
            </div>
          )}

          {/* Email read-only */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">{t('email')}</label>
            <Input value={user?.email ?? ''} disabled className="bg-muted/40 text-muted-foreground" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground">
            {saving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('saving')}</>
              : <><Check className="h-4 w-4 mr-2" />{t('save')}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
