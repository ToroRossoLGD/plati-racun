import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { today, validAmount, validDate } from '../bills';
import { TaxPayment, initialTaxes, taxDeadline, taxReminder, taxTotal } from '../taxes';
import { useTaxes } from './TaxStore';

const money = (n: number) => n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function TaxScreen() {
  const { id, year: routeYear } = useLocalSearchParams<{ id?: string; year?: string }>();
  const store = useTaxes();
  const [year, setYear] = useState(routeYear && /^\d{4}$/.test(routeYear) ? Number(routeYear) : new Date().getFullYear());
  const [draft, setDraft] = useState<TaxPayment | null>(null);
  const [error, setError] = useState('');
  const locations = store.records[String(year)] || initialTaxes();
  const location = locations.find(l => l.id === id);
  async function save(clear = false) {
    if (!draft || !location) return;
    if (!clear) {
      if (!draft.amount || !validAmount(draft.amount)) return setError('Unesi ispravan iznos, npr. 2500,50.');
      if (!validDate(draft.date)) return setError('Unesi datum plaćanja ili izaberi „Današnji datum“.');
      if (Number(draft.date.split('.')[2]) !== year) return setError(`Datum plaćanja mora biti u ${year}. godini.`);
    }
    const next = locations.map(l => l.id === location.id ? { ...l, payments: l.payments.map(p => p.id === draft.id ? clear ? { ...p, amount: '', date: '' } : { ...draft } : p) } : l);
    if (await store.save({ ...store.records, [String(year)]: next })) setDraft(null);
    else setError('Čuvanje nije uspelo. Pokušaj ponovo.');
  }
  const back = () => { if (router.canGoBack()) router.back(); else router.replace(id ? '/tax' : '/'); };
  return <SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <Pressable style={s.back} onPress={back} accessibilityRole="button"><Text style={s.backText}>← {id ? 'Porez — sve lokacije' : 'Početna'}</Text></Pressable>
      <Text style={s.eyebrow}>PLATI RAČUN / POREZ</Text><Text style={s.title}>{location?.name || 'Porez'}</Text>
      <Text style={s.subtitle}>{location ? 'Dodirni polje da uneseš plaćeni iznos i datum.' : 'Izaberi lokaciju i evidentiraj uplate poreza.'}</Text>
      <View style={s.year}><Pressable accessibilityLabel="Prethodna godina" style={s.yearButton} onPress={() => setYear(y => Math.max(2000, y - 1))}><Text style={s.backText}>←</Text></Pressable><Text style={s.yearText}>{year}. godina</Text><Pressable accessibilityLabel="Sledeća godina" style={s.yearButton} onPress={() => setYear(y => Math.min(2100, y + 1))}><Text style={s.backText}>→</Text></Pressable></View>
      {!store.ready ? store.failed ? <><Text style={s.error}>Porez nije učitan. Sačuvani podaci nisu menjani.</Text><Pressable style={s.primary} onPress={store.retry}><Text style={s.white}>Pokušaj ponovo</Text></Pressable></> : <ActivityIndicator color="#BB3535" size="large" /> : id && !location ? <Text style={s.error}>Lokacija nije pronađena.</Text> : <>
      {!location ? locations.map(l => <Pressable accessibilityRole="button" key={l.id} style={s.location} onPress={() => router.push({ pathname: '/tax/[id]', params: { id: l.id, year: String(year) } })}><View style={s.flex}><Text style={s.cardTitle}>{l.name}</Text><Text style={s.muted}>{l.payments.filter(p => p.amount && p.date).length}/{l.payments.length} uplata · {money(taxTotal([l]))} RSD</Text></View><Text style={s.arrow}>→</Text></Pressable>) : <View style={s.grid}>{location.payments.map((p, i) => {
        const deadline = taxDeadline(location, i, year);
        const paid = !!p.amount && !!p.date;
        return <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${location.payments.length === 4 ? 'Kvartal' : 'Uplata'} ${i + 1}, ${paid ? 'plaćeno' : 'nije plaćeno'}`} style={[s.rectangle, paid && s.paid]} onPress={() => { setError(''); setDraft({ ...p }); }}><Text style={s.cardTitle}>{location.payments.length === 4 ? `${i + 1}. kvartal` : location.payments.length === 1 ? 'Godišnji porez' : `${i + 1}. uplata`}</Text><Text style={s.deadline}>{deadline ? `Rok: ${deadline}` : 'Ručni unos'}</Text><Text style={[s.reminder, paid && s.paidText]}>{taxReminder(deadline, p)}</Text><Text style={s.amount}>{paid ? `${money(Number(p.amount.replace(',', '.')))} RSD` : '＋ Unesi uplatu'}</Text>{paid && <Text style={s.muted}>{p.date}</Text>}</Pressable>;
      })}</View>}
      <View style={s.total}><Text style={s.totalLabel}>Ukupno plaćeno poreza do sad</Text><Text style={s.totalAmount}>{money(taxTotal(location ? [location] : locations))} RSD</Text><Text style={s.muted}>{year}. godina · {location ? location.name : 'Sve lokacije'}</Text></View>
      </>}
    </ScrollView>
    <Modal visible={!!draft} animationType="slide" onRequestClose={() => { if (!store.saving) setDraft(null); }}><SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Pressable disabled={store.saving} style={s.back} onPress={() => setDraft(null)}><Text style={s.backText}>← Odustani</Text></Pressable><Text style={s.title}>Uplata poreza</Text><Text style={s.subtitle}>{location?.name} · {year}.</Text><Text style={s.label}>Plaćeni iznos (RSD)</Text><TextInput editable={!store.saving} style={s.input} value={draft?.amount || ''} onChangeText={amount => setDraft(d => d && ({ ...d, amount }))} keyboardType="decimal-pad" placeholder="0,00" maxLength={12} /><Text style={s.label}>Datum plaćanja</Text><TextInput editable={!store.saving} style={s.input} value={draft?.date || ''} onChangeText={date => setDraft(d => d && ({ ...d, date }))} keyboardType="numbers-and-punctuation" placeholder="DD.MM.GGGG." maxLength={11} /><Pressable disabled={store.saving} style={s.today} onPress={() => setDraft(d => d && ({ ...d, date: today() }))}><Text style={s.backText}>Današnji datum</Text></Pressable>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Pressable disabled={store.saving} style={[s.primary, store.saving && s.disabled]} onPress={() => void save()}><Text style={s.white}>{store.saving ? 'Čuvanje…' : 'Sačuvaj uplatu'}</Text></Pressable>{location?.payments.find(p => p.id === draft?.id)?.amount && <Pressable disabled={store.saving} style={s.today} onPress={() => void save(true)}><Text style={s.backText}>Obriši ovu uplatu</Text></Pressable>}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
  </KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6F0' }, flex: { flex: 1 }, page: { padding: 24, paddingBottom: 40, maxWidth: 620, width: '100%', alignSelf: 'center' }, back: { paddingVertical: 16, alignSelf: 'flex-start' }, backText: { color: '#A82D2D', fontWeight: '700', fontSize: 15 }, eyebrow: { color: '#BB3535', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 14 }, title: { color: '#193B32', fontSize: 32, fontWeight: '800', marginTop: 14 }, subtitle: { color: '#68766E', lineHeight: 23, marginTop: 12, marginBottom: 20 }, year: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, backgroundColor: '#fff', borderRadius: 16 }, yearButton: { padding: 18 }, yearText: { fontSize: 18, color: '#193B32', fontWeight: '700' }, location: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#E3E8DD' }, cardTitle: { color: '#193B32', fontSize: 16, fontWeight: '700' }, muted: { color: '#68766E', fontSize: 12, marginTop: 8, lineHeight: 18 }, arrow: { color: '#BB3535', fontSize: 24 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, rectangle: { width: '47%', flexGrow: 1, padding: 16, minHeight: 180, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E6CAC7' }, paid: { backgroundColor: '#EAF3E9', borderColor: '#A7C8AD' }, deadline: { color: '#BB3535', marginTop: 14, fontWeight: '600', fontSize: 12 }, reminder: { color: '#BB3535', marginTop: 8, fontSize: 12, lineHeight: 18 }, paidText: { color: '#166A57' }, amount: { color: '#193B32', marginTop: 18, fontSize: 16, fontWeight: '700' }, total: { backgroundColor: '#FBE5E1', borderRadius: 18, padding: 22, marginTop: 26 }, totalLabel: { color: '#92302C', fontSize: 16, fontWeight: '700' }, totalAmount: { color: '#92302C', fontSize: 28, fontWeight: '800', marginTop: 14 }, label: { color: '#193B32', fontWeight: '600', marginBottom: 10, marginTop: 22 }, input: { backgroundColor: '#fff', borderColor: '#D8DED4', borderWidth: 1, borderRadius: 14, padding: 16, color: '#193B32', fontSize: 17 }, today: { paddingVertical: 20, alignItems: 'center' }, primary: { backgroundColor: '#BB3535', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 18 }, white: { color: '#fff', fontSize: 17, fontWeight: '700' }, error: { color: '#AC3434', lineHeight: 23 }, disabled: { opacity: 0.5 },
});
