import React, { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bill, Location, LEGACY_STORAGE_KEY, STORAGE_KEY, amountNumber, initialLocations, isForwarding, isLocations, migrateLocations, today, validAmount, validDate } from '../bills';

const money = (n: number) => n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let billWrites = Promise.resolve();
function queueBillWrite(write: () => Promise<void>) {
  billWrites = billWrites.then(write);
}
export default function Main() {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const { id: selected } = useLocalSearchParams<{ id?: string }>();
  const [draft, setDraft] = useState<Bill | null>(null);
  const [error, setError] = useState('');
  const location = locations.find(l => l.id === selected);
  const forwarding = !!location && isForwarding(location);
  async function load() {
    try {
      await billWrites;
      const current = await AsyncStorage.getItem(STORAGE_KEY);
      const raw = current ?? await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const data: unknown = JSON.parse(raw);
        if (!isLocations(data)) throw new Error('Invalid data');
        const next = current ? data : migrateLocations(data);
        if (!current) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setLocations(next);
      }
      setReady(true);
    } catch { setLoadError(true); }
  }
  useFocusEffect(useCallback(() => { void load(); }, []));
  function persist(next: Location[]) {
    setLocations(next);
    queueBillWrite(async () => {
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSaveError(false); }
      catch { setSaveError(true); }
    });
  }
  function updateBill(bill: Bill) {
    persist(locations.map(l => l.id === selected ? { ...l, bills: l.bills.some(b => b.id === bill.id) ? l.bills.map(b => b.id === bill.id ? bill : b) : [...l.bills, bill] } : l));
  }
  function toggle(bill: Bill) {
    updateBill({ ...bill, paid: !bill.paid, date: forwarding ? '' : !bill.paid ? bill.date || today() : '' });
  }
  function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) return setError('Unesi naziv računa.');
    if (!validAmount(draft.amount)) return setError('Unesi ispravan iznos, npr. 2500,50.');
    if (draft.date && !validDate(draft.date)) return setError('Unesi ispravan datum: DD.MM.GGGG.');
    updateBill({ ...draft, name: draft.name.trim(), date: draft.paid ? draft.date || today() : draft.date });
    setDraft(null);
  }
  const allBills = locations.filter(l => !isForwarding(l)).flatMap(l => l.bills);
  const bills = location?.bills || allBills;
  const paid = bills.filter(b => b.paid);
  const total = bills.reduce((sum, b) => sum + amountNumber(b.amount), 0);
  const openDraft = (bill: Bill) => { setError(''); setDraft({ ...bill }); };
  return <SafeAreaProvider><SafeAreaView style={s.safe}>
    <StatusBar style="dark" />
    {!ready ? <View style={s.loading}>{loadError ? <><Text style={s.title}>Podaci nisu učitani</Text><Text style={s.muted}>Sačuvani računi nisu menjani. Pokušaj ponovo.</Text><Pressable style={s.primary} onPress={() => { setLoadError(false); void load(); }}><Text style={s.primaryText}>Pokušaj ponovo</Text></Pressable></> : <ActivityIndicator color="#166A57" size="large" />}</View> : <>
    <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
      <View style={s.top}><Text style={s.brand}>PR / PLATI RAČUN</Text><View style={s.badge}><Text style={s.badgeText}>LIČNA EVIDENCIJA</Text></View></View>
      {location && <Pressable onPress={() => router.replace('/')} accessibilityRole="button" style={s.back}><Text style={s.backText}>← Sve lokacije</Text></Pressable>}
      <Text style={s.title}>{location ? location.name : 'Računi pod kontrolom.'}</Text>
      <Text style={s.subtitle}>{location ? forwarding ? 'Označi kada pošalješ račun osobi koja treba da plati.' : 'Označi plaćeno i sačuvaj detalje svakog računa.' : 'Pet lokacija. Sve obaveze na jednom mestu.'}</Text>
      <View style={s.summary}>{forwarding ? <><Text style={s.summaryLabel}>SLANJE RAČUNA</Text><Text style={s.total}>{paid.length} / {bills.length}</Text><Text style={s.summaryNote}>računa poslato osobi koja plaća</Text></> : <><Text style={s.summaryLabel}>{location ? 'UKUPAN IZNOS ZA LOKACIJU' : 'UKUPAN IZNOS RAČUNA'}</Text><Text style={s.total}>{money(total)} <Text style={s.currency}>RSD</Text></Text><Text style={s.summaryNote}>{paid.length} od {bills.length} računa plaćeno</Text><Text style={s.summaryNote}>Preostalo {money(bills.filter(b => !b.paid).reduce((sum, b) => sum + amountNumber(b.amount), 0))} RSD</Text></>}<View style={s.track}><View style={[s.progress, { width: `${bills.length ? paid.length / bills.length * 100 : 0}%` }]} /></View></View>
      {!location && <Link href="/tax" asChild><Pressable style={{ backgroundColor: "#C73535", paddingVertical: 24, borderRadius: 18, alignItems: "center", marginTop: 18 }} accessibilityRole="button"><Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>Porez</Text></Pressable></Link>}
      {saveError && <Pressable style={s.errorBox} onPress={() => persist(locations)}><Text style={s.error}>Čuvanje nije uspelo. Dodirni ovde da pokušaš ponovo.</Text></Pressable>}
      <View style={s.section}><Text style={s.sectionTitle}>{location ? 'Računi' : 'Tvoje lokacije'}</Text><Text style={s.muted}>{location ? `${bills.length} stavki` : '5 lokacija'}</Text></View>
      {!location ? locations.map((l, i) => {
        const count = l.bills.filter(b => b.paid).length;
        return <Pressable key={l.id} accessibilityRole="button" accessibilityLabel={`Otvori ${l.name}`} onPress={() => router.push({ pathname: '/bills/[id]', params: { id: l.id } })} style={({ pressed }) => [s.locationCard, pressed && s.pressed]}><View style={s.number}><Text style={s.numberText}>{String(i + 1).padStart(2, '0')}</Text></View><View style={s.flex}><Text style={s.cardTitle}>{l.name}</Text><Text style={s.muted}>{isForwarding(l) ? `${count}/${l.bills.length} poslato` : `${count}/${l.bills.length} plaćeno · ${money(l.bills.reduce((sum, b) => sum + amountNumber(b.amount), 0))} RSD`}</Text></View><Text style={s.arrow}>↗</Text></Pressable>;
      }) : <>
        {location.bills.map(b => <View key={b.id} style={s.billCard}><View style={s.billTop}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: b.paid }} accessibilityLabel={`${b.name}, ${forwarding ? "račun poslat" : "plaćeno"}`} onPress={() => toggle(b)} style={[s.checkbox, b.paid && s.checked]}><Text style={s.checkmark}>{b.paid ? '✓' : ''}</Text></Pressable><Pressable style={s.flex} onPress={() => forwarding ? toggle(b) : openDraft(b)} accessibilityRole="button"><Text style={s.cardTitle}>{b.name}</Text><Text style={[s.state, b.paid && s.paidText]}>{forwarding ? b.paid ? 'Račun poslat' : 'Račun nije poslat' : b.paid ? 'Plaćeno' : 'Za plaćanje'}</Text></Pressable>{!forwarding && <Pressable onPress={() => openDraft(b)} style={s.edit}><Text style={s.backText}>Uredi</Text></Pressable>}</View>{!forwarding && <View style={s.billDetails}><Text style={s.amount}>{b.amount ? `${money(amountNumber(b.amount))} RSD` : 'Iznos nije unet'}</Text><Text style={s.muted}>{b.date ? `Datum: ${b.date}` : 'Datum nije unet'}</Text></View>}</View>)}
        {!forwarding && <Pressable style={s.add} accessibilityRole="button" onPress={() => openDraft({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: '', paid: false, amount: '', date: '' })}><Text style={s.backText}>＋ Dodaj račun</Text></Pressable>}
      </>}
      <Text style={s.footer}>Tvoja evidencija, uvek pri ruci.{'\n'}Podaci se čuvaju na ovom uređaju.</Text>
    </ScrollView>
    <Modal visible={!!draft} animationType="slide" onRequestClose={() => setDraft(null)}><SafeAreaView style={s.safe}><KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled"><Pressable style={s.back} onPress={() => setDraft(null)}><Text style={s.backText}>← Odustani</Text></Pressable><Text style={s.title}>Detalji računa</Text><Text style={s.subtitle}>{location?.name}</Text>
      <Text style={s.label}>Naziv računa</Text><TextInput style={s.input} value={draft?.name || ''} onChangeText={name => setDraft(d => d && ({ ...d, name }))} placeholder="Npr. Struja" maxLength={60} />
      <Text style={s.label}>Iznos (RSD)</Text><TextInput style={s.input} value={draft?.amount || ''} onChangeText={amount => setDraft(d => d && ({ ...d, amount }))} placeholder="0,00" keyboardType="decimal-pad" maxLength={12} />
      <Text style={s.label}>Datum plaćanja</Text><TextInput style={s.input} value={draft?.date || ''} onChangeText={date => setDraft(d => d && ({ ...d, date }))} placeholder="DD.MM.GGGG." keyboardType="numbers-and-punctuation" maxLength={11} /><Pressable style={s.back} onPress={() => setDraft(d => d && ({ ...d, date: today() }))}><Text style={s.backText}>Postavi današnji datum</Text></Pressable>
      <Pressable style={s.toggleRow} accessibilityRole="checkbox" accessibilityState={{ checked: draft?.paid || false }} onPress={() => setDraft(d => d && ({ ...d, paid: !d.paid, date: !d.paid ? d.date || today() : '' }))}><View style={[s.checkbox, draft?.paid && s.checked]}><Text style={s.checkmark}>{draft?.paid ? '✓' : ''}</Text></View><Text style={s.cardTitle}>Račun je plaćen</Text></Pressable>
      {!!error && <Text style={s.error} accessibilityRole="alert">{error}</Text>}
      <Pressable style={s.primary} onPress={saveDraft}><Text style={s.primaryText}>Sačuvaj račun</Text></Pressable>
    </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>
    </>}
  </SafeAreaView></SafeAreaProvider>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6F0' }, flex: { flex: 1 }, loading: { flex: 1, justifyContent: 'center', padding: 24, gap: 20 }, page: { padding: 24, paddingBottom: 40, maxWidth: 620, width: '100%', alignSelf: 'center' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 10 }, brand: { color: '#166A57', fontWeight: '800', fontSize: 13, letterSpacing: 1 }, badge: { borderWidth: 1, borderColor: '#D8DED4', borderRadius: 20, padding: 8 }, badgeText: { fontSize: 9, color: '#68766E', fontWeight: '600', letterSpacing: 1 }, title: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#193B32', letterSpacing: -1 }, subtitle: { color: '#68766E', fontSize: 15, lineHeight: 23, marginTop: 10, marginBottom: 26 }, summary: { padding: 22, backgroundColor: '#166A57', borderRadius: 24 }, summaryLabel: { color: '#BBD7C8', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }, total: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 14, marginBottom: 14 }, currency: { fontSize: 16, color: '#BBD7C8' }, summaryNote: { fontSize: 12, color: '#D2E6DA', marginTop: 5 }, track: { height: 4, backgroundColor: '#408675', borderRadius: 4, marginTop: 18, overflow: 'hidden' }, progress: { height: 4, backgroundColor: '#C5E697' }, section: { marginTop: 30, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { fontSize: 20, color: '#193B32', fontWeight: '700' }, muted: { color: '#7A847B', fontSize: 12, lineHeight: 20 }, locationCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E8DD', borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }, number: { width: 42, height: 46, backgroundColor: '#EFF4E9', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, numberText: { fontSize: 14, color: '#166A57', fontWeight: '700' }, cardTitle: { fontSize: 16, color: '#193B32', fontWeight: '700', marginBottom: 4 }, arrow: { fontSize: 24, color: '#166A57' }, pressed: { opacity: 0.65 }, back: { paddingVertical: 12, alignSelf: 'flex-start' }, backText: { color: '#166A57', fontSize: 14, fontWeight: '700' }, billCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E3E8DD', padding: 18, borderRadius: 18, marginBottom: 12 }, billTop: { flexDirection: 'row', alignItems: 'center', gap: 14 }, checkbox: { width: 34, height: 34, borderWidth: 2, borderColor: '#BBC9BE', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: '#166A57', borderColor: '#166A57' }, checkmark: { color: '#fff', fontSize: 22, fontWeight: '700' }, state: { color: '#A47737', fontSize: 12 }, paidText: { color: '#166A57' }, edit: { padding: 10 }, billDetails: { borderTopWidth: 1, borderColor: '#EFF1EB', paddingTop: 14, marginTop: 14, gap: 6 }, amount: { fontSize: 18, fontWeight: '600', color: '#193B32' }, add: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#A6BAAC', padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 6 }, footer: { color: '#8A948A', textAlign: 'center', fontSize: 11, lineHeight: 19, marginTop: 28 }, label: { color: '#193B32', fontWeight: '600', marginBottom: 9, marginTop: 20 }, input: { backgroundColor: '#fff', borderColor: '#D8DED4', borderWidth: 1, borderRadius: 14, padding: 16, color: '#193B32', fontSize: 17 }, toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 24 }, primary: { backgroundColor: '#166A57', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 12 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 }, error: { color: '#AC3434', lineHeight: 21 }, errorBox: { padding: 15, backgroundColor: '#FFEAE5', borderRadius: 12, marginTop: 16 },
});
