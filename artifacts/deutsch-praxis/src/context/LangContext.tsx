import React, { createContext, useContext, useState } from 'react';

export type Lang = 'de' | 'en';

export const translations = {
  de: {
    appName: 'DeutschPraxis',
    tagline: 'Dein Raum für besseres Deutsch',
    // nav
    overview: 'Übersicht',
    vocab: 'Wortschatz',
    grammar: 'Grammatik',
    listening: 'Hören',
    writing: 'Schreiben',
    progress: 'Fortschritt',
    classes: 'Klassen',
    exercises: 'Übungen',
    analytics: 'Analysen',
    // topbar / profile
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    language: 'Sprache',
    logout: 'Abmelden',
    profile: 'Profil',
    editProfile: 'Profil bearbeiten',
    // profile dialog
    displayName: 'Anzeigename',
    niveau: 'Niveau (CEFR)',
    email: 'E-Mail',
    save: 'Speichern',
    saving: 'Speichern…',
    cancel: 'Abbrechen',
    uploadImage: 'Bild hochladen',
    removeImage: 'Entfernen',
    imageHint: 'JPG, PNG oder WebP · max. 2 MB',
    imageError: 'Ungültiges Format',
    imageErrorDesc: 'Bitte wähle ein Bild (JPG, PNG, WebP).',
    imageSizeError: 'Datei zu groß',
    imageSizeErrorDesc: 'Maximal 2 MB erlaubt.',
    saved: 'Gespeichert',
    savedDesc: 'Dein Profil wurde aktualisiert.',
    saveError: 'Fehler',
    saveErrorDesc: 'Speichern fehlgeschlagen. Bitte erneut versuchen.',
    nameRequired: 'Name erforderlich',
    nameRequiredDesc: 'Der Anzeigename darf nicht leer sein.',
    niveauHint: 'Dein Niveau bestimmt, welche Übungen dir angezeigt werden.',
    chooseNiveau: 'Niveau wählen…',
  },
  en: {
    appName: 'DeutschPraxis',
    tagline: 'Your space for better German',
    // nav
    overview: 'Overview',
    vocab: 'Vocabulary',
    grammar: 'Grammar',
    listening: 'Listening',
    writing: 'Writing',
    progress: 'Progress',
    classes: 'Classes',
    exercises: 'Exercises',
    analytics: 'Analytics',
    // topbar / profile
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    language: 'Language',
    logout: 'Log out',
    profile: 'Profile',
    editProfile: 'Edit profile',
    // profile dialog
    displayName: 'Display name',
    niveau: 'Level (CEFR)',
    email: 'Email',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    uploadImage: 'Upload image',
    removeImage: 'Remove',
    imageHint: 'JPG, PNG or WebP · max 2 MB',
    imageError: 'Invalid format',
    imageErrorDesc: 'Please choose an image (JPG, PNG, WebP).',
    imageSizeError: 'File too large',
    imageSizeErrorDesc: 'Maximum 2 MB allowed.',
    saved: 'Saved',
    savedDesc: 'Your profile has been updated.',
    saveError: 'Error',
    saveErrorDesc: 'Failed to save. Please try again.',
    nameRequired: 'Name required',
    nameRequiredDesc: 'Display name cannot be empty.',
    niveauHint: 'Your level determines which exercises are shown to you.',
    chooseNiveau: 'Choose level…',
  },
} as const;

export type TranslationKey = keyof typeof translations['de'];

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'de',
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('dp_lang') as Lang) ?? 'de';
    } catch {
      return 'de';
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('dp_lang', l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] as string;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
