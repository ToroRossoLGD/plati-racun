import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TaxProvider } from '../TaxStore';
export default function Layout() {
  return <SafeAreaProvider><TaxProvider><Stack screenOptions={{ headerShown: false }} /></TaxProvider></SafeAreaProvider>;
}
