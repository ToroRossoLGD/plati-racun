# Plati račun

A standalone app for everyday needs, built with React Native, Expo, Expo Router, and TypeScript, with local storage via AsyncStorage. The interface is in Serbian.

## Bill tracking

| Location | Bills | Tracking |
| --- | --- | --- |
| Street One | Infostan, Electricity, Internet, UNIQA | Payment amount, date, and paid status |
| Street Two | Electricity, Internet | Whether the bill has been sent to the person responsible for payment |
| Street Three | Electricity, Gile, Building Manager, Yettel, Infostan | Payment amount, date, and paid status |
| More | Electricity | Payment amount, date, and paid status |
| Petrovac | Electricity, Utilities | Payment amount, date, and paid status |

For payment locations, you can edit bill names, enter amounts in RSD and payment dates, and add bills. Marking a bill as paid sets today's date if no date is entered. Unchecking it clears the date and keeps the amount. Forwarded bills are excluded from payment totals.

Bills for Street One, Street Two, and Street Three are due by the 15th of each month, except electricity, which is due by the 28th. These recurring deadlines are displayed on each bill, including bills forwarded to someone else for payment. More and Petrovac have no preset monthly bill deadlines.

## Tax tracking


The red **Porez** button on the home screen opens tax tracking for all five locations.

- Street One, Street Two, and Street Three each have four quarterly payments with configured deadlines of February 15, May 15, August 15, and November 15.
- Petrovac has two payments without preset deadlines.
- More has one annual payment without a preset deadline.
- Each payment stores an amount in RSD and a payment date, with a **Today's date** shortcut.
- Completed payments are summed per location and across all locations for the selected year. Records for different years are kept separately.
- Deadline reminders appear inside the app; phone notifications are not implemented.
- A reminder at the very top of the home screen appears from 10 days before each quarterly deadline through the deadline day. It shows the remaining calendar days, refreshes at midnight and when returning to the app, and opens tax tracking when tapped.

## Running on your phone

1. Install Expo Go with support for Expo SDK 57 on your phone.
2. Run `npm install` in this project folder, then `npm start`.
3. Connect your computer and phone to the same local network.
4. Scan the terminal's QR code with Expo Go on Android or the Camera app on iPhone.

If the local connection fails, run `npm run start:tunnel` and open the displayed `exp://...exp.direct` address in Expo Go. Both devices need internet access for the tunnel. Keep the development server running while previewing the app. The tunnel address may change after a restart.

[Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/)

## Data storage

Bills and tax records are stored locally using AsyncStorage. No backend account is needed for record keeping. Clearing the app's data or uninstalling it deletes local records. Existing bill data is migrated by bill name, with the original storage key retained as a backup. Tax records use a separate storage key.

Bills currently represent the current set of obligations; monthly bill history is not implemented. The app records payments and does not perform bank transfers. Standalone Android APK or iOS installation requires a development or production build; this project is currently set up for Expo Go previews.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npx expo export --platform android --output-dir dist`
