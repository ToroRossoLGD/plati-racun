import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAX_STORAGE_KEY, TaxRecords, validTaxes } from '../taxes';

type Store = { records: TaxRecords; ready: boolean; failed: boolean; saving: boolean; retry: () => void; save: (next: TaxRecords) => Promise<boolean> };
const Context = createContext<Store | null>(null);
export function TaxProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<TaxRecords>({});
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(TAX_STORAGE_KEY).then(raw => {
      const data: unknown = raw ? JSON.parse(raw) : {};
      if (!validTaxes(data)) throw new Error('Invalid tax records');
      if (active) { setRecords(data); setReady(true); }
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  async function save(next: TaxRecords) {
    if (!ready || saving) return false;
    setSaving(true);
    try { await AsyncStorage.setItem(TAX_STORAGE_KEY, JSON.stringify(next)); setRecords(next); return true; }
    catch { return false; }
    finally { setSaving(false); }
  }
  return <Context.Provider value={{ records, ready, failed, saving, save, retry: () => { setFailed(false); setAttempt(a => a + 1); } }}>{children}</Context.Provider>;
}
export function useTaxes() {
  const context = useContext(Context);
  if (!context) throw new Error('TaxProvider missing');
  return context;
}
