# Plati račun

A standalone app for everyday needs, built with React Native, Expo, and TypeScript, with local storage via AsyncStorage. Track bills, payment amounts, and payment dates across five locations. The interface is in Serbian.

React Native / Expo aplikacija za ličnu evidenciju računa na pet lokacija: Ilije Stojadinovića, Pere Velimirovića, 2. Srpske, More i Petrovac.

Svaka lokacija ima početne račune (Struja, Voda, Internet, Komunalije). Moguće je dodati svoj račun, promeniti naziv i iznos u RSD, uneti datum plaćanja i označiti račun kao plaćen. Čekiranje automatski upisuje današnji datum ako datum nije unet. Skidanje oznake briše datum, a zadržava iznos. Ekrani prikazuju ukupne iznose i broj plaćenih računa.

## Pokretanje na telefonu

1. Instaliraj Expo Go na telefon, u verziji koja podržava Expo SDK 57.
2. U ovom folderu pokreni `npm install` (samo ako zavisnosti nisu instalirane), zatim `npm start`.
3. Računar i telefon poveži na istu Wi-Fi mrežu.
4. Skeniraj QR kod iz terminala kroz Expo Go na Androidu ili kamerom na iPhone-u.

Ako Expo Go ne može da pristupi računaru preko lokalne mreže, pokreni `npm run start:tunnel`. Otvori novu `exp://...exp.direct` adresu iz terminala u Expo Go. Tunel zahteva internet na računaru i telefonu; adresa se može promeniti pri ponovnom pokretanju.

Uputstvo i podržane verzije: https://docs.expo.dev/get-started/set-up-your-environment/

## Čuvanje podataka

Podaci se automatski čuvaju lokalno pomoću AsyncStorage. Za evidenciju nisu potrebni nalog ni server. Deinstalacija aplikacije ili brisanje njenih podataka briše i evidenciju. Ova verzija sadrži trenutni skup računa po lokaciji; mesečna istorija još nije implementirana. Aplikacija evidentira plaćanja i ne izvršava bankarske uplate.

## Provere

- `npx tsc --noEmit`
- `node --test tests/bills.test.mjs`
- `npx expo export --platform android --output-dir dist`

Samostalna APK/iOS instalacija zahteva razvojni ili produkcioni build. Trenutna verzija je pripremljena za pregled kroz Expo Go.
