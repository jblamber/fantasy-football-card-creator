import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {toast} from "react-toastify";

export type AppSettings = {
  powerSaving: boolean;
  setPowerSaving: (v: boolean) => void;
  togglePowerSaving: () => void;
  tiltMode: boolean;
  toggleTiltMode: () => void;
};

const AppSettingsContext = createContext<AppSettings | undefined>(undefined);

function getInitialPowerSaving(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = window.localStorage.getItem('ffcg:powerSaving');
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [powerSaving, setPowerSavingState] = useState<boolean>(getInitialPowerSaving);
  const [tiltMode, setTiltModeState] = useState<boolean>(false);

  useEffect(() => {
    try {
      window.localStorage.setItem('ffcg:powerSaving', powerSaving ? '1' : '0');
    } catch {}
  }, [powerSaving]);

  const setPowerSaving = useCallback((v: boolean) => setPowerSavingState(v), []);
  const togglePowerSaving = useCallback(() => setPowerSavingState((p) => {
      toast.info('Power saving mode is now ' + (p ? 'off' : 'on'));
      return !p
  }), []);
  const toggleTiltMode = useCallback(() => setTiltModeState((t) => {
      toast.info('Tilt mode is now ' + (t ? 'off' : 'on when animations are enabled.'));
      return !t
  }), []);

  const value = useMemo<AppSettings>(() => ({ powerSaving, setPowerSaving, togglePowerSaving, tiltMode, toggleTiltMode }), [powerSaving, setPowerSaving, togglePowerSaving, tiltMode, toggleTiltMode]);

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
