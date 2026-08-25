# Android install build

This POS is now configured as an installable web app and as a Capacitor Android app.

## Build an APK

Install Node.js LTS, Android Studio with the Android SDK, and a JDK (17 or newer), then run these commands in this folder:

```powershell
npm install
npm run android:add
npm run android:sync
npm run android:open
```

In Android Studio, use **Build > Build APK(s)**. The debug APK will be under:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly on a USB-debugging-enabled phone:

```powershell
npm run android:sync
cd android
.\gradlew.bat assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Quick Android install without an APK

Serve this folder over HTTP, open it in Chrome on Android, then choose **Add to Home screen**. The manifest and service worker are already included.

The application data remains local to the installed app through IndexedDB. Export a report or backup regularly because clearing the app data removes the local database.

## Build without Android Studio

The repository includes a GitHub Actions workflow at `.github/workflows/build-apk.yml`. Upload this folder to a GitHub repository, then open **Actions > Build Android APK > Run workflow**. When the run finishes, download the artifact named `tyre-sales-moc-pos-debug-apk` and install the APK on the phone.

This cloud build supplies the Android SDK, Gradle, Java, and Node.js. No Android Studio is required on the laptop. The VS Code extensions **GitHub Pull Requests and Issues** and **GitHub Actions** can be used to publish the folder and monitor the build.