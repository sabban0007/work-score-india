import React, { useState, useEffect, useMemo } from "react";
import { Search, User, Building2, ShieldCheck, Star, Clock, Zap, Users, Wrench, ShieldAlert, MapPin, Phone, CheckCircle2, X } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, authInstance as auth, storage } from "./firebase";

const C = {
  bg: "#E4E4E4",
  card: "#ffffff",
  border: "#C8C8C8",
  text: "#000000",
  subtext: "#6b6b6b",
  accent: "#5b7fc7",
  accentDim: "#B2C8ED",
  green: "#3a7d44",
  greenBg: "#3a7d4418",
  red: "#c0392b",
  input: "#ffffff",
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

const SKILLS = ["Electrician", "Plumber", "Driver", "Mistri", "Welder", "Painter", "Helper"];

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
  const [form, setForm] = useState({ name: "", mobile: "", city: "", skill: SKILLS[0], experience: "", prevEmployer: "", prevEmployerMobile: "" });
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
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginLockedUntil, setLoginLockedUntil] = useState(0);

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
    } catch (err) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      if (attempts >= 5) {
        const backoffMs = Math.min(30000, 2000 * 2 ** (attempts - 5)); // exponential backoff, capped 30s
        setLoginLockedUntil(Date.now() + backoffMs);
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
      name: form.name.trim(), mobile: form.mobile.trim(), city: form.city.trim(), skill: form.skill,
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
        newWorker.aadhaarPhotoUrl = await getDownloadURL(fileRef);
        setUploading(false);
      }
      await setDoc(doc(db, "workers", newWorker.mobile), newWorker);
      setForm({ name: "", mobile: "", city: "", skill: SKILLS[0], experience: "", prevEmployer: "", prevEmployerMobile: "" });
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
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
        .fade-in { animation: fadeIn .25s ease-out; }
        input::placeholder { color: #6b7d8c; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #3a4a3d; border-radius: 4px; }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: C.navy, padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>WS</span>
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#ffffff", letterSpacing: 0.3 }}>{t.appName}</h1>
              <p style={{ fontSize: 10, color: "#b8b8b8", margin: 0 }}>{t.tagline}</p>
            </div>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ background: "#ffffff20", border: "1px solid #ffffff40", borderRadius: 6, padding: "4px 8px", fontSize: 12, color: "#ffffff" }}
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k} style={{ color: C.navy }}>{v.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 4, maxWidth: 960, margin: "12px auto 0", background: "#ffffff15", padding: 4, borderRadius: 10, border: "1px solid #ffffff30", width: "fit-content" }}>
          {[
            { key: "worker", label: t.worker, icon: User },
            { key: "employer", label: t.employer, icon: Building2 },
            ...(showAdminTab ? [{ key: "admin", label: t.admin, icon: ShieldCheck }] : [])
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                background: role === key ? C.accent : "transparent",
                color: role === key ? "#ffffff" : "#c3cbe0"
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: 16, paddingBottom: 64 }}>
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

const inputStyle = { width: "100%", background: C.input, border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" };

function FieldError({ msg }) {
  if (!msg) return null;
  return <span style={{ color: C.red, fontSize: 11, display: "block", marginTop: 4 }}>{msg}</span>;
}

function WorkerRegisterView({ t, form, setForm, onSubmit, savedMsg, skills, formErrors = {}, formError, aadhaarFile, setAadhaarFile, uploading }) {
  return (
    <div className="fade-in" style={{ maxWidth: 420 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t.register}</h2>
      {savedMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.green, fontSize: 14, marginBottom: 12, background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 6, padding: "8px 12px" }}>
          <CheckCircle2 size={16} /> {t.successMsg}
        </div>
      )}
      {formError && (
        <div style={{ color: C.red, fontSize: 13, marginBottom: 12, background: "#c0392b18", border: `1px solid ${C.red}`, borderRadius: 6, padding: "8px 12px" }}>
          {formError}
        </div>
      )}
      <form onSubmit={onSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        <Field label={t.name}>
          <input required maxLength={60} style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FieldError msg={formErrors.name} />
        </Field>
        <Field label={t.mobile}>
          <input required type="tel" inputMode="numeric" maxLength={10} style={inputStyle} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} />
          <FieldError msg={formErrors.mobile} />
        </Field>
        <Field label={t.city}>
          <input maxLength={60} style={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <FieldError msg={formErrors.city} />
        </Field>
        <Field label={t.skill}>
          <select style={inputStyle} value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })}>
            {skills.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <FieldError msg={formErrors.skill} />
        </Field>
        <Field label={t.experience}>
          <input type="number" min="0" max="60" style={inputStyle} value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          <FieldError msg={formErrors.experience} />
        </Field>
        <Field label={t.prevEmployer}>
          <input maxLength={60} style={inputStyle} value={form.prevEmployer} onChange={(e) => setForm({ ...form, prevEmployer: e.target.value })} />
        </Field>
        <Field label={t.prevEmployerMobile}>
          <input type="tel" inputMode="numeric" maxLength={10} style={inputStyle} value={form.prevEmployerMobile} onChange={(e) => setForm({ ...form, prevEmployerMobile: e.target.value.replace(/\D/g, "") })} />
          <FieldError msg={formErrors.prevEmployerMobile} />
        </Field>
        <Field label="Aadhaar Photo (optional)">
          <input type="file" accept="image/jpeg,image/png,image/webp" style={inputStyle} onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)} />
          <FieldError msg={formErrors.aadhaar} />
        </Field>
        <button type="submit" disabled={uploading} style={{ width: "100%", background: C.accent, color: "#ffffff", fontWeight: 700, border: "none", borderRadius: 6, padding: "10px 0", fontSize: 14, marginTop: 8, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1 }}>
          {uploading ? "Photo upload ho rahi hai..." : t.submit}
        </button>
      </form>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? C.green : score >= 40 ? C.accent : C.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <svg width="34" height="34" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.border} strokeWidth="3" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 97.4} 97.4`} strokeLinecap="round" transform="rotate(-90 18 18)" />
      </svg>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

function Badges({ w, t }) {
  const badges = [
    w.onTime && { icon: Clock, label: t.onTime },
    w.emergencyReady && { icon: Zap, label: t.emergencyReady },
    w.teamLeader && { icon: Users, label: t.teamLeader },
    w.multiSkill && { icon: Wrench, label: t.multiSkill },
    w.safe && { icon: ShieldAlert, label: t.safe }
  ].filter(Boolean);
  if (!badges.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {badges.map(({ icon: Icon, label }, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, background: C.input, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 8px", color: C.accent }}>
          <Icon size={10} /> {label}
        </span>
      ))}
    </div>
  );
}

function EmployerSearchView({ t, query, setQuery, filtered, onSelect }) {
  return (
    <div className="fade-in">
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.subtext }} />
        <input
          style={{ ...inputStyle, paddingLeft: 36 }}
          placeholder={t.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <p style={{ color: C.subtext, fontSize: 14 }}>{t.noResults}</p>
      ) : (
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {filtered.map((w) => {
            const s = calcScore(w);
            return (
              <button key={w.id} onClick={() => onSelect(w)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, textAlign: "left", cursor: "pointer", color: C.text }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{w.photo}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{w.name}</p>
                      <p style={{ fontSize: 11, color: C.subtext, margin: 0 }}>{w.skill} • {w.city || "—"}</p>
                    </div>
                  </div>
                  <ScoreBadge score={s.total} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 11, color: C.subtext }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color={C.accent} fill={C.accent} /> {s.avgRating || "—"}</span>
                  <span>• {w.jobsCompleted} {t.jobs}</span>
                  {w.verifiedEmployers > 0 && <CheckCircle2 size={11} color={C.green} />}
                </div>
                <Badges w={w} t={t} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileModal({ t, worker, onClose }) {
  const s = calcScore(worker);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000a0", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, padding: 16 }} onClick={onClose}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, width: "100%", maxWidth: 420, borderRadius: 16, padding: 20, maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{worker.photo}</div>
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>{worker.name}</p>
              <p style={{ fontSize: 12, color: C.subtext, display: "flex", alignItems: "center", gap: 4, margin: "2px 0" }}><MapPin size={11} />{worker.city || "—"} • {worker.skill}</p>
              <p style={{ fontSize: 12, color: C.subtext, display: "flex", alignItems: "center", gap: 4, margin: 0 }}><Phone size={11} />{worker.mobile}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.subtext, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <ScoreBadge score={s.total} />
          <span style={{ fontSize: 14, color: C.subtext }}>{t.workScore}</span>
        </div>
        <Badges w={worker} t={t} />
        <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <p style={{ fontSize: 12, color: C.subtext, marginBottom: 8 }}>{t.scoreBreakdown}</p>
          {[
            [t.experience, s.exp, 25], ["Rating", s.ratingScore, 25],
            [t.verified + " Employer", s.empScore, 20], [t.jobs, s.jobScore, 20], ["Docs", s.docScore, 10]
          ].map(([label, val, max]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: C.subtext }}>{label}</span>
              <span>{val}/{max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminLoginView({ t, loginForm, setLoginForm, onSubmit, error }) {
  return (
    <div className="fade-in" style={{ maxWidth: 360 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Admin Login</h2>
      <form onSubmit={onSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
        {error && <p style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{error}</p>}
        <Field label="Email">
          <input required type="email" style={inputStyle} value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input required type="password" style={inputStyle} value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
        </Field>
        <button type="submit" style={{ width: "100%", background: C.navy, color: "#ffffff", fontWeight: 700, border: "none", borderRadius: 6, padding: "10px 0", fontSize: 14, marginTop: 4, cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
}

function AdminView({ t, workers, updateWorker, addRating, onLogout, adminEmail }) {
  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t.adminPanelTitle}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: C.subtext }}>{adminEmail}</span>
          <button onClick={onLogout} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: C.input, border: `1px solid ${C.border}`, cursor: "pointer", color: C.text }}>
            Logout
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {workers.map((w) => {
          const s = calcScore(w);
          return (
            <div key={w.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.input, display: "flex", alignItems: "center", justifyContent: "center" }}>{w.photo}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{w.name}</p>
                    <p style={{ fontSize: 11, color: C.subtext, margin: 0 }}>{w.skill} • {w.mobile}</p>
                    {w.aadhaarPhotoUrl && (
                      <a href={w.aadhaarPhotoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent, textDecoration: "underline" }}>
                        Aadhaar photo dekho
                      </a>
                    )}
                  </div>
                </div>
                <ScoreBadge score={s.total} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
                <button
                  onClick={() => updateWorker(w.id, { verifiedEmployers: Math.min(w.verifiedEmployers + 1, 5) })}
                  style={{ padding: "5px 10px", borderRadius: 6, background: C.input, border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
                >
                  + {t.verifyEmployerBtn} ({w.verifiedEmployers})
                </button>
                <button
                  onClick={() => updateWorker(w.id, { aadhaarVerified: !w.aadhaarVerified })}
                  style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: w.aadhaarVerified ? C.greenBg : C.input, border: `1px solid ${w.aadhaarVerified ? C.green : C.border}`, color: w.aadhaarVerified ? C.green : C.text }}
                >
                  {t.verifyDocBtn}
                </button>
                <button
                  onClick={() => updateWorker(w.id, { mobileVerified: !w.mobileVerified })}
                  style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: w.mobileVerified ? C.greenBg : C.input, border: `1px solid ${w.mobileVerified ? C.green : C.border}`, color: w.mobileVerified ? C.green : C.text }}
                >
                  Mobile OTP
                </button>
                {["onTime", "emergencyReady", "teamLeader", "multiSkill", "safe"].map((key) => (
                  <button
                    key={key}
                    onClick={() => updateWorker(w.id, { [key]: !w[key] })}
                    style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", background: w[key] ? C.accentDim : C.input, border: `1px solid ${w[key] ? C.accent : C.border}`, color: w[key] ? C.accent : C.subtext }}
                  >
                    {t[key] || key}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: C.subtext, marginRight: 4 }}>{t.giveRating}:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => addRating(w.id, n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                    <Star size={14} color={C.accent} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
