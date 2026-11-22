import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.astudio.efutbol",
  appName: "e-futbol",
  webDir: "www",
  server: {
    // Live game backend (Next.js on Vercel). Offline shell still ships in www/.
    url: "https://futbol-ashen.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#05070c",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#05070c",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#05070c",
    },
  },
};

export default config;
