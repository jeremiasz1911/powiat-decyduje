import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { STORAGE_KEYS } from '@/src/constants/storage';
import { secureStore } from '@/src/lib/secure-store';

export type ThemePreference = 'system' | 'light' | 'dark';
export type FontScalePreference = 'normal' | 'large' | 'xlarge';

type AppSettings = {
  theme: ThemePreference;
  fontScale: FontScalePreference;
  hapticsEnabled: boolean;
};

type SettingsContextValue = {
  settings: AppSettings;
  ready: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setFontScale: (fontScale: FontScalePreference) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  fontScaleMultiplier: number;
};

const defaultSettings: AppSettings = {
  theme: 'system',
  fontScale: 'normal',
  hapticsEnabled: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function mapFontScaleToMultiplier(scale: FontScalePreference): number {
  if (scale === 'large') {
    return 1.1;
  }

  if (scale === 'xlarge') {
    return 1.22;
  }

  return 1;
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  const persist = useCallback(async (next: AppSettings) => {
    await secureStore.set(STORAGE_KEYS.appSettings, JSON.stringify(next));
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const raw = await secureStore.get(STORAGE_KEYS.appSettings);

      if (!raw) {
        setReady(true);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;

        setSettings({
          theme: parsed.theme ?? defaultSettings.theme,
          fontScale: parsed.fontScale ?? defaultSettings.fontScale,
          hapticsEnabled:
            typeof parsed.hapticsEnabled === 'boolean'
              ? parsed.hapticsEnabled
              : defaultSettings.hapticsEnabled,
        });
      } catch {
        setSettings(defaultSettings);
      } finally {
        setReady(true);
      }
    };

    void loadSettings();
  }, []);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      const next = { ...settings, theme };
      setSettings(next);
      await persist(next);
    },
    [persist, settings]
  );

  const setFontScale = useCallback(
    async (fontScale: FontScalePreference) => {
      const next = { ...settings, fontScale };
      setSettings(next);
      await persist(next);
    },
    [persist, settings]
  );

  const setHapticsEnabled = useCallback(
    async (enabled: boolean) => {
      const next = { ...settings, hapticsEnabled: enabled };
      setSettings(next);
      await persist(next);
    },
    [persist, settings]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready,
      setTheme,
      setFontScale,
      setHapticsEnabled,
      fontScaleMultiplier: mapFontScaleToMultiplier(settings.fontScale),
    }),
    [ready, setFontScale, setHapticsEnabled, setTheme, settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
}
