import { StyleSheet, Text } from 'react-native';
import { billDueDay } from '../bills';

export default function BillDeadline({ locationId, billName }: { locationId: string; billName: string }) {
  const day = billDueDay(locationId, billName);
  if (!day) return null;
  return <Text style={s.deadline}>Rok za plaćanje: do {day}. u mesecu</Text>;
}
const s = StyleSheet.create({
  deadline: { color: '#A24728', fontSize: 12, lineHeight: 18, marginTop: 6 },
});
