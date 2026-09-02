import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBS1_AO3dxqy83-p5zRjGFEIvi-SyKaaxI",
  authDomain: "work-score-india-web.firebaseapp.com",
  projectId: "work-score-india-web",
  storageBucket: "work-score-india-web.firebasestorage.app",
  messagingSenderId: "60459562494",
  appId: "1:60459562494:web:be673994288c8c3d403caf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const authInstance = getAuth(app);
export const storage = getStorage(app);

// App Check (bot/script protection) — OFF by default until a real
// reCAPTCHA v3 site key is set below. See README: "App Check setup".
// Safe to leave as-is; the app works normally without it.
const RECAPTCHA_SITE_KEY = "PASTE_YOUR_RECAPTCHA_V3_SITE_KEY_HERE";
if (RECAPTCHA_SITE_KEY !== "PASTE_YOUR_RECAPTCHA_V3_SITE_KEY_HERE") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

// Offline support: app keeps working without internet, syncs automatically
// once connection returns. Fails silently on unsupported browsers/private mode.
enableIndexedDbPersistence(db).catch(() => {});

// Analytics: only initializes in a real browser (not during build/SSR),
// tracks which cities/skills get the most activity. Free, no extra setup needed
// beyond enabling Analytics for this project in Firebase console.
export let analytics = null;
isSupported().then((ok) => {
  if (ok) analytics = getAnalytics(app);
});
