import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { upcomingQuarterReminder } from '../taxes';

export default function TaxDeadlineBanner() {
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => {
    const next = new Date();
    setNow(previous => previous.toDateString() === next.toDateString() ? previous : next);
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function scheduleMidnight() {
      const current = new Date();
      const midnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
      timer = setTimeout(() => { refresh(); scheduleMidnight(); }, midnight.getTime() - current.getTime() + 100);
    }
    scheduleMidnight();
    // Also catches manual clock/time-zone changes while the screen stays open.
    const interval = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { refresh(); clearTimeout(timer); scheduleMidnight(); }
    });
    return () => { clearTimeout(timer); clearInterval(interval); subscription.remove(); };
  }, [refresh]);
  const reminder = upcomingQuarterReminder(now);
  if (!reminder) return null;
  const message = reminder.daysLeft === 0 ? 'Danas je rok za plaćanje poreza!' : reminder.daysLeft === 1 ? 'Preostao je još 1 dan do roka za plaćanje poreza.' : `Preostalo je još ${reminder.daysLeft} dana do roka za plaćanje poreza.`;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${message} Otvori porez.`} style={s.banner} onPress={() => router.push('/tax')}>
    <Text style={s.title} accessibilityLiveRegion="polite">{message}</Text>
    <Text style={s.detail}>{reminder.quarter}. kvartal · Rok: {reminder.deadline}</Text>
    <Text style={s.link}>Otvori porez →</Text>
  </Pressable>;
}
const s = StyleSheet.create({
  banner: { backgroundColor: '#FCE4DF', borderWidth: 1, borderColor: '#D8988D', borderLeftWidth: 5, borderLeftColor: '#BB3535', padding: 20, borderRadius: 16, marginBottom: 24, gap: 10 },
  title: { color: '#922626', fontSize: 18, lineHeight: 26, fontWeight: '800' },
  detail: { color: '#922626', fontSize: 14, lineHeight: 21 },
  link: { color: '#922626', fontSize: 14, fontWeight: '700' },
});
