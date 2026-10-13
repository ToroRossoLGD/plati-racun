# Plati račun

A standalone app for everyday needs, built with React Native, Expo, and TypeScript, with local storage via AsyncStorage. Track bills, payment amounts, and payment dates across five locations. The interface is in Serbian.

A React Native / Expo app for tracking personal bills across five locations: Ilije Stojadinovića, Pere Velimirovića, 2. Srpske, More, and Petrovac.

Each location starts with four bills: Electricity, Water, Internet, and Utilities (displayed in Serbian). You can add your own bills, edit their names and amounts in RSD, enter payment dates, and mark bills as paid. Checking a bill automatically sets today's date if no date has been entered. Unchecking it clears the date while keeping the amount. The screens show total amounts and the number of paid bills.

## Running on your phone

1. Install a version of Expo Go that supports Expo SDK 57 on your phone.
2. In this project folder, run `npm install` if dependencies are not installed, then run `npm start`.
3. Connect your computer and phone to the same local network.
4. Scan the QR code displayed in the terminal using Expo Go on Android or the Camera app on iPhone.

If Expo Go cannot reach your computer over the local network, run `npm run start:tunnel`. Open the new `exp://...exp.direct` address from the terminal in Expo Go. Both your computer and phone need internet access when using the tunnel. The address may change when the server restarts.

Setup instructions and supported versions: https://docs.expo.dev/get-started/set-up-your-environment/

## Data storage

Data is automatically saved locally using AsyncStorage. Bill tracking does not require an account or a backend server. Uninstalling the app or clearing its data also deletes your records. This version stores the current set of bills for each location; monthly history has not yet been implemented. The app records payments and does not perform bank transfers.

## Validation

- `npx tsc --noEmit`
- `node --test tests/bills.test.mjs`
- `npx expo export --platform android --output-dir dist`

A standalone Android APK or iOS installation requires a development or production build. The current version is set up for previewing in Expo Go.
