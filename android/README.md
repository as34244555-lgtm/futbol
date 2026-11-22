# e-futbol Android (Capacitor)

- **Paket:** `com.astudio.efutbol`
- **Canlı URL:** `https://futbol-ashen.vercel.app` (WebView)
- **İmza:** `../release-secrets/keystore.properties` (git’e girmez)

## Release AAB

```bash
export ANDROID_HOME=$HOME/android-sdk
npx cap sync android
cd android && ./gradlew bundleRelease
# çıktı: app/build/outputs/bundle/release/app-release.aab
```

Keystore ve şifreler `release-secrets/` altında tutulur. Kaybetme.
