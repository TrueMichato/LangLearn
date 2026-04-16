import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function useDarkMode() {
  const darkMode = useSettingsStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return darkMode;
}
