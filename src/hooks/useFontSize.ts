import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

export function useFontSize() {
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-size', fontSize + 'px');
  }, [fontSize]);

  return fontSize;
}
