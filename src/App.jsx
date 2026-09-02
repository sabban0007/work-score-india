import React, { useState, useEffect, useMemo } from "react";
import { Search, User, Building2, ShieldCheck, Star, Clock, Zap, Users, Wrench, ShieldAlert, MapPin, Phone, CheckCircle2, X } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getBlob } from "firebase/storage";
import { db, authInstance as auth, storage } from "./firebase";

const C = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "#C8C8C8",
  text: "#000000",
  subtext: "#6b6b6b",
  accent: "#000000",
  accentDim: "#B2C8ED",
  green: "#2f8f4e",
  greenBg: "#eaf7ee",
  red: "#d64545",
  input: "#E4E4E4",
  navy: "#000000"
};

const LANGS = {
  hi: {
    label: "हिंदी",
    appName: "वर्क स्कोर इंडिया",
    tagline: "हर हाथ की मेहनत का डिजिटल सबूत",
    worker: "मज़दूर", employer: "ठेकेदार", admin: "एडमिन",
    register: "रजिस्टर करें", name: "नाम", mobile: "मोबाइल नंबर", city: "शहर",
    skill: "काम (स्किल)", experience: "अनुभव (साल)", prevEmployer: "पिछला ठेकेदार का नाम",
    prevEmployerMobile: "पिछले ठेकेदार का मोबाइल", submit: "जमा करें",
    searchPlaceholder: "स्किल या शहर से खोजें", noResults: "कोई मज़दूर नहीं मिला",
    workScore: "वर्क स्कोर", verified: "वेरीफाइड", notVerified: "वेरीफाई नहीं",
    onTime: "समय के पाबंद", emergencyReady: "इमरजेंसी रेडी", teamLeader: "टीम लीडर",
    multiSkill: "मल्टी-स्किल", safe: "सुरक्षित काम", jobs: "काम पूरे",
    adminPanelTitle: "एडमिन पैनल — वेरिफिकेशन", verifyEmployerBtn: "ठेकेदार वेरीफाई करें",
    verifyDocBtn: "डॉक्यूमेंट वेरीफाई करें", giveRating: "रेटिंग दें",
    successMsg: "रजिस्ट्रेशन हो गया!", scoreBreakdown: "स्कोर विवरण"
  },
  en: {
    label: "English",
    appName: "Work Score India", tagline: "Digital proof of every worker's hard work",
    worker: "Worker", employer: "Employer", admin: "Admin",
    register: "Register", name: "Name", mobile: "Mobile Number", city: "City",
    skill: "Skill", experience: "Experience (years)", prevEmployer: "Previous Employer Name",
    prevEmployerMobile: "Previous Employer Mobile", submit: "Submit",
    searchPlaceholder: "Search by skill or city", noResults: "No workers found",
    workScore: "Work Score", verified: "Verified", notVerified: "Not Verified",
    onTime: "On-Time", emergencyReady: "Emergency Ready", teamLeader: "Team Leader",
    multiSkill: "Multi-Skill", safe: "Safety Record", jobs: "Jobs Done",
    adminPanelTitle: "Admin Panel — Verification", verifyEmployerBtn: "Verify Employer",
    verifyDocBtn: "Verify Document", giveRating: "Give Rating",
    successMsg: "Registered successfully!", scoreBreakdown: "Score Breakdown"
  },
  bho: {
    label: "भोजपुरी/मैथिली",
    appName: "वर्क स्कोर इंडिया", tagline: "हर मजूर के मेहनत के डिजिटल सबूत",
    worker: "मजूर", employer: "ठेकेदार", admin: "एडमिन",
    register: "नाँव लिखाईं", name: "नाँव", mobile: "मोबाइल नंबर", city: "शहर",
    skill: "काम", experience: "अनुभव (साल)", prevEmployer: "पहिले वाला ठेकेदार के नाँव",
    prevEmployerMobile: "पहिले वाला ठेकेदार के मोबाइल", submit: "जमा करीं",
    searchPlaceholder: "स्किल भा शहर से खोजीं", noResults: "कोई मजूर ना मिलल",
    workScore: "वर्क स्कोर", verified: "वेरीफाइड", notVerified: "वेरीफाई नईखे",
    onTime: "टाइम के पाबंद", emergencyReady: "इमरजेंसी रेडी", teamLeader: "टीम लीडर",
    multiSkill: "मल्टी-स्किल", safe: "सुरक्षित काम", jobs: "काम पूरा भइल",
    adminPanelTitle: "एडमिन पैनल — वेरिफिकेशन", verifyEmployerBtn: "ठेकेदार वेरीफाई करीं",
    verifyDocBtn: "डॉक्यूमेंट वेरीफाई करीं", giveRating: "रेटिंग दीं",
    successMsg: "रजिस्ट्रेशन हो गइल!", scoreBreakdown: "स्कोर के ब्यौरा"
  }
};

const SKILLS = [
  "Electrician", "Plumber", "Driver", "Mistri", "Welder", "Painter", "Helper",
  "Mason", "Bar Bender", "AC Technician", "Mobile/CCTV Technician",
  "Bike/Car Mechanic", "Cook", "Security Guard", "Tailor", "Farm Labour",
  "Other"
];
const OTHER_SKILL = "Other";

function calcScore(w) {
  let exp = 0;
  if (w.experience >= 10) exp = 25;
  else if (w.experience >= 7) exp = 20;
  else if (w.experience >= 4) exp = 15;
  else if (w.experience >= 2) exp = 10;
  else exp = 5;

  const avgRating = w.ratings.length ? w.ratings.reduce((a, b) => a + b, 0) / w.ratings.length : 0;
  const ratingScore = Math.round((avgRating / 5) * 25);

  const empScore = w.verifiedEmployers >= 3 ? 20 : w.verifiedEmployers === 2 ? 14 : w.verifiedEmployers === 1 ? 8 : 0;

  const totalJobs = w.jobsCompleted + w.jobsIncomplete;
  const completionRate = totalJobs ? w.jobsCompleted / totalJobs : 0;
  const jobScore = totalJobs === 0 ? 0 : Math.round(completionRate * 20);

  const docScore = (w.aadhaarVerified ? 5 : 0) + (w.mobileVerified ? 5 : 0);

  const base = exp + ratingScore + empScore + jobScore + docScore;

  return { total: Math.min(base, 100), exp, ratingScore, empScore, jobScore, docScore, avgRating: avgRating.toFixed(1) };
}

// Strict schema validation — reject anything that doesn't match, not just sanitize
const MOBILE_RE = /^[6-9]\d{9}$/; // Indian mobile: 10 digits, starts 6-9
function validateWorkerForm(form) {
  const errors = {};
  if (!form.name || form.name.trim().length < 2 || form.name.trim().length > 60) {
    errors.name = "Naam 2-60 characters ka hona chahiye";
  }
  if (!MOBILE_RE.test(form.mobile.trim())) {
    errors.mobile = "10 digit ka sahi mobile number daalo (jaise 98765xxxxx)";
  }
  if (form.city && form.city.trim().length > 60) {
    errors.city = "City ka naam bahut lamba hai";
  }
  if (!SKILLS.includes(form.skill)) {
    errors.skill = "Sahi skill chuno";
  }
  if (form.skill === OTHER_SKILL) {
    const custom = (form.customSkill || "").trim();
    if (custom.length < 2 || custom.length > 40) {
      errors.customSkill = "Apna kaam 2-40 characters me likho";
    }
  }
  const exp = Number(form.experience);
  if (form.experience !== "" && (!Number.isFinite(exp) || exp < 0 || exp > 60)) {
    errors.experience = "Experience 0-60 ke beech honi chahiye";
  }
  if (form.prevEmployerMobile && form.prevEmployerMobile.trim() && !MOBILE_RE.test(form.prevEmployerMobile.trim())) {
    errors.prevEmployerMobile = "Employer ka mobile number sahi format me nahi hai";
  }
  return errors;
}

// Generic, safe messages for the user — never show raw Firebase/JS error text
function genericErrorMessage(context) {
  const messages = {
    register: "Registration abhi save nahi hua. Thodi der baad phir try karo.",
    login: "Login nahi ho paya. Email/password check karo.",
    update: "Update save nahi hua. Phir try karo.",
    load: "Data load karne me dikkat aa rahi hai. Page refresh karo."
  };
  return messages[context] || "Kuch galat ho gaya. Phir try karo.";
}

export default function App() {
  const [lang, setLang] = useState("hi");
  const t = LANGS[lang];
  const [role, setRole] = useState("worker");
  // Admin tab is hidden from normal visitors. It only appears if the app is
  // opened with a secret URL param, e.g. yoursite.web.app/?panel=owner2026
  const ADMIN_SECRET = "owner2026"; // change this to any word you like
  const [showAdminTab, setShowAdminTab] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("panel") === ADMIN_SECRET) {
      setShowAdminTab(true);
    }
  }, []);
  const [workers, setWorkers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ name: "", mobile: "", city: "", skill: SKILLS[0], customSkill: "", experience: "", prevEmployer: "", prevEmployerMobile: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [lastSubmitAt, setLastSubmitAt] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminChecked, setAdminChecked] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(() => Number(sessionStorage.getItem("loginAttempts")) || 0);
  const [loginLockedUntil, setLoginLockedUntil] = useState(() => Number(sessionStorage.getItem("loginLockedUntil")) || 0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAdminChecked(true);
    });
    return () => unsub();
  }, []);

  // Client-side backoff for login attempts (per-browser). Real per-IP/per-account
  // limiting needs a backend (Cloud Functions) — see note in README.
  async function handleAdminLogin(e) {
    e.preventDefault();
    setLoginError("");
    if (Date.now() < loginLockedUntil) {
      const secs = Math.ceil((loginLockedUntil - Date.now()) / 1000);
      setLoginError(`Bahut baar try kiya. ${secs} second baad phir try karo.`);
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      setLoginAttempts(0);
      sessionStorage.removeItem("loginAttempts");
      sessionStorage.removeItem("loginLockedUntil");
    } catch (err) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      sessionStorage.setItem("loginAttempts", String(attempts));
      if (attempts >= 5) {
        const backoffMs = Math.min(30000, 2000 * 2 ** (attempts - 5)); // exponential backoff, capped 30s
        const until = Date.now() + backoffMs;
        setLoginLockedUntil(until);
        sessionStorage.setItem("loginLockedUntil", String(until));
      }
      setLoginError(genericErrorMessage("login"));
    }
  }

  function handleAdminLogout() {
    signOut(auth);
  }

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "workers"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWorkers(list);
      setLoaded(true);
      setLoadError("");
    }, (err) => {
      console.error("Firestore error:", err); // full detail stays in dev console only
      setLoaded(true);
      setLoadError(genericErrorMessage("load"));
    });
    return () => unsub();
  }, []);

  // Basic client-side throttle: block resubmits within 3 seconds (stops accidental
  // double-taps / crude spam). Real rate limiting needs a backend — see README.
  const SUBMIT_COOLDOWN_MS = 3000;

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setFormError("");
    const errors = validateWorkerForm(form);
    if (aadhaarFile && !["image/jpeg", "image/png", "image/webp"].includes(aadhaarFile.type)) {
      errors.aadhaar = "Sirf photo (jpg/png) upload karo";
    }
    if (aadhaarFile && aadhaarFile.size > 5 * 1024 * 1024) {
      errors.aadhaar = "Photo 5MB se choti honi chahiye";
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (Date.now() - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
      setFormError("Thoda ruko, phir try karo.");
      return;
    }
    const newWorker = {
      name: form.name.trim(), mobile: form.mobile.trim(), city: form.city.trim(),
      skill: form.skill === OTHER_SKILL ? form.customSkill.trim() : form.skill,
      experience: Number(form.experience) || 0,
      prevEmployer: form.prevEmployer.trim(), prevEmployerMobile: form.prevEmployerMobile.trim(),
      ratings: [], verifiedEmployers: 0, jobsCompleted: 0, jobsIncomplete: 0,
      aadhaarVerified: false, mobileVerified: false, onTime: false, emergencyReady: false,
      teamLeader: false, multiSkill: false, safe: false, photo: "👤"
    };
    try {
      setLastSubmitAt(Date.now());
      if (aadhaarFile) {
        setUploading(true);
        const fileRef = ref(storage, `aadhaar/${newWorker.mobile}`);
        await uploadBytes(fileRef, aadhaarFile);
        newWorker.aadhaarPhotoUploaded = true;
        setUploading(false);
      }
      await setDoc(doc(db, "workers", newWorker.mobile), newWorker);
      setForm({ name: "", mobile: "", city: "", skill: SKILLS[0], customSkill: "", experience: "", prevEmployer: "", prevEmployerMobile: "" });
      setAadhaarFile(null);
      setFormErrors({});
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      setUploading(false);
      console.error("Register failed:", err); // full detail stays in dev console only
      if (err.code === "permission-denied") {
        setFormError("Yeh mobile number pehle se registered hai, ya form me kuch galat hai.");
      } else {
        setFormError(genericErrorMessage("register"));
      }
    }
  }

  async function updateWorker(id, patch) {
    try {
      await updateDoc(doc(db, "workers", id), patch);
    } catch (err) {
      console.error("Update failed:", err); // full detail stays in dev console only
      // admin-side update errors surface via console; UI just won't reflect the change
    }
  }

  function addRating(id, star) {
    const w = workers.find((x) => x.id === id);
    updateWorker(id, { ratings: [...w.ratings, star], jobsCompleted: w.jobsCompleted + 1 });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q ? workers : workers.filter((w) => w.skill.toLowerCase().includes(q) || w.city.toLowerCase().includes(q) || w.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => calcScore(b).total - calcScore(a).total);
  }, [workers, query]);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: C.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
        .fade-in { animation: fadeIn .25s ease-out; }
        input::placeholder { color: #a3a3a3; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 4px; }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#ffffffee", backdropFilter: "blur(8px)", borderBottom: "1px solid #f0f0f0", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 960, margin: "0 auto" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: C.text, letterSpacing: -0.4 }}>{t.appName}</h1>
            <p style={{ fontSize: 12, color: C.subtext, margin: "2px 0 0" }}>{t.tagline}</p>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ background: "#fafafa", border: "1px solid #ececec", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: C.text }}
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px", paddingBottom: 96 }}>
        {!loaded ? (
          <p style={{ color: C.subtext, fontSize: 14 }}>Loading...</p>
        ) : role === "worker" ? (
          <WorkerRegisterView t={t} form={form} setForm={setForm} onSubmit={handleRegister} savedMsg={savedMsg} skills={SKILLS} formErrors={formErrors} formError={formError} aadhaarFile={aadhaarFile} setAadhaarFile={setAadhaarFile} uploading={uploading} />
        ) : role === "employer" ? (
          <EmployerSearchView t={t} query={query} setQuery={setQuery} filtered={filtered} onSelect={setSelectedWorker} />
        ) : role === "admin" && showAdminTab ? (
          !adminChecked ? (
            <p style={{ color: C.subtext, fontSize: 14 }}>Loading...</p>
          ) : !adminUser ? (
            <AdminLoginView t={t} loginForm={loginForm} setLoginForm={setLoginForm} onSubmit={handleAdminLogin} error={loginError} />
          ) : (
            <AdminView t={t} workers={workers} updateWorker={updateWorker} addRating={addRating} onLogout={handleAdminLogout} adminEmail={adminUser.email} />
          )
        ) : null}
      </main>

      {savedMsg && (
        <div style={{
          position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 30,
          display: "flex", alignItems: "center", gap: 8, background: "#000000", color: "#ffffff",
          fontSize: 13, padding: "10px 18px", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,0.25)"
        }} className="fade-in">
          <CheckCircle2 size={16} /> {t.successMsg}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "0 20px 24px", fontSize: 11, color: C.subtext }}>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: C.subtext, textDecoration: "underline", marginRight: 14 }}>Privacy Policy</a>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ color: C.subtext, textDecoration: "underline" }}>Terms of Service</a>
      </div>

      {/* Bottom tab bar — clean, minimal, mobile-app style */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#ffffff", borderTop: "1px solid #f0f0f0", padding: "8px 12px calc(8px + env(safe-area-inset-bottom))", zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-around", maxWidth: 480, margin: "0 auto" }}>
          {[
            { key: "worker", label: t.worker, icon: User },
            { key: "employer", label: t.employer, icon: Building2 },
            ...(showAdminTab ? [{ key: "admin", label: t.admin, icon: ShieldCheck }] : [])
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 18px",
                border: "none", background: "none", cursor: "pointer",
                color: role === key ? C.accent : "#9a9a9a"
              }}
            >
              <Icon size={20} strokeWidth={role === key ? 2.4 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: role === key ? 700 : 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {selectedWorker && (
        <ProfileModal t={t} worker={selectedWorker} onClose={() => setSelectedWorker(null)} />
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: C.subtext, marginBottom: 4, display: "block" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = { width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" };

function FieldError({ msg }) {
  if (!msg) return null;
  return <span style={{ color: C.red, fontSize: 11, display: "block", marginTop: 4 }}>{msg}</span>;
}

function WorkerRegisterView({ t, form, setForm, onSubmit, savedMsg, skills, formErrors = {}, formError, aadhaarFile, setAadhaarFile, uploading }) {
  return (
    <div className="fade-in" style={{ maxWidth: 420 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.register}</h2>
      {formError && (
        <div style={{ color: C.red, fontSize: 13, marginBottom: 12, background: "#c0392b18", border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 12px" }}>
          {formError}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <Field label={t.name}>
          <input required 
