# Work Score India — Deploy Guide (Tablet se)

## STEP 1: GitHub par account banao
1. github.com kholo, Sign up karo (free)

## STEP 2: Naya repository banao
1. "+" → "New repository"
2. Naam: work-score-india
3. Public rakho, "Create repository" dabao

## STEP 3: Sab files upload karo
1. Repository ke andar "Add file" → "Upload files" dabao
2. Is poore folder ki saari files (aur sub-folders) drag-drop ya select karke upload karo
3. Neeche "Commit changes" dabao

## STEP 4: Firebase Hosting ko GitHub se connect karo
1. console.firebase.google.com kholo, apna "Work Score India Web" project kholo
2. Left menu me "Hosting" par jao → "Get started"
3. "Connect to GitHub" option chuno
4. Apna GitHub account connect karo, "work-score-india" repository select karo
5. Build command: `npm run build`
6. Output directory: `dist`
7. "Finish" dabao — Firebase khud build karke live website bana dega

## STEP 5: Firestore aur Authentication on karo (agar abhi tak nahi kiya)
1. Firebase console me "Firestore Database" → "Create database" → production mode → Mumbai region
2. "Authentication" → "Get started" → "Phone" method ON karo

## Jab bhi app me kuch badalna ho
1. Claude se naya code lo
2. GitHub par jaake wahi file "Edit" karke naya code paste karo, ya dobara upload karo
3. Firebase khud-ba-khud naya version live kar dega (kuch minute lagte hain)

## Admin login setup (ZAROORI — pehli baar karna hai)
1. Firebase console → "Authentication" → "Sign-in method" → "Email/Password" ko ON karo
2. "Users" tab → "Add user" → apna email + ek strong password daalo
3. Yehi email/password Admin tab me login karne ke liye use hoga
4. Ab sirf isi login se Admin panel me verify/rating/badge change ho payega — koi aur nahi kar sakta

## Security checks — kya lagu hai aur kya nahi

**Dependency audit (karna hoga tumhe, ya kisi PC/laptop se):**
GitHub par upload karne ke baad, agar kabhi laptop mile, to project folder me:
```
npm install
npm audit
```
Ye command bata dega kis package me security issue hai aur severity kya hai. Abhi tablet se yeh check nahi ho sakta kyuki isme `node_modules` install karna padta hai.

**Rate limiting — is stack me limit hai:**
Yeh app ek static website + Firebase hai, koi apna server/backend nahi hai — isliye "real" server-side rate limiting (per-IP block, exponential backoff by IP) seedha implement nahi ho sakta bina Cloud Functions (Firebase ka paid "Blaze" plan) ke.

Abhi ke liye jo laga hai:
- **Login (Admin)**: 5 galat try ke baad 30 second tak lock (client-side, browser me). Firebase Authentication khud bhi bahut zyada galat try par apne aap thoda slow kar deta hai.
- **Worker registration**: 3 second ka cooldown taaki koi double-tap ya jaldi-jaldi spam na kar sake.

Jab users badhenge (500+) aur Blaze plan pe upgrade karo, tab Cloud Functions se asli per-IP rate limiting add karwana — abhi bata dena, alag se banayenge.

## Rules ab kya-kya rokte hain (production-grade)
- **Duplicate registration**: ek mobile number se sirf ek hi profile ban sakti hai (mobile number hi document ID hai — Firestore khud duplicate ko reject kar deta hai)
- **Extra/fake fields**: koi bhi field jo list me nahi hai (jaise koi score seedha inject karne ki koshish), reject ho jayega
- **Format validation**: naam, mobile, skill, experience — sab ka format database level par bhi check hota hai, sirf app ke form me nahi
- **Score fields locked at registration**: naya worker khud apna rating/score/verified status 0 ke alawa kuch nahi likh sakta

## Free features ab code me added hain
- **Offline support**: internet chala jaaye to bhi app kaam karega, wapas aane par data khud sync ho jayega
- **Analytics**: code me lagaya hai, lekin **Firebase console me bhi enable karna hoga**:
  1. Firebase console → "Project Overview" ke paas ⚙️ icon nahi, left menu me "Analytics" section dhoondo (agar na dikhe, "Integrations" ya "Analytics" search karo)
  2. "Enable Google Analytics" karo
  3. Ho jaye to app khud data bhejna shuru kar dega — kaunsa city/skill zyada search hota hai, wahi console me "Analytics" tab me dikhega

## Ye 3 abhi console-only hain (code nahi lagta, sirf settings on karni hai)
- **App Check** (fake/bot registrations rokta hai): Firebase console → "App Check" → apna web app select karo → "reCAPTCHA v3" provider se register karo. Yeh thoda technical hai — jab karna ho tab bata dena, step-by-step karwayenge
- **Custom domain** (workscoreindia.com jaisa naam): Firebase console → "Hosting" → "Add custom domain" — pehle domain kharidna padega (~₹700-1000/saal kisi domain seller se), phir yahi jodna hai
- **Push notifications**: Firebase console → "Cloud Messaging" — worker/employer ko "naya job", "verified hua" jaisa alert bhejne ke liye. Isme thoda extra code bhi lagta hai (permission maangna, token save karna) — jab chaho tab bana dunga

## Third-party services (abhi zaroorat nahi)
Algolia (smart search), Cloudinary (photo compression), Sentry (crash tracking) — ye sab alag company ke free plans hain, alag se signup karna padta hai. Jab app me photo-upload ya bada search load aayega, tab in par soch sakte hain.

## Aadhaar photo upload — naya feature, setup zaroori hai
1. Firebase console → left menu me **"Storage"** (Databases and storage ke andar) → **"Get started"**
2. "Production mode" chuno → Next → Location: **asia-south1 (Mumbai)** → "Done"
3. Storage → **"Rules"** tab → is project ke `storage.rules` file ka content paste karke **"Publish"**

**Zaroori baat samajh lo:** Firebase ka download link banane ka tarika aisa hai ki jis kisi ke paas wo link ho, wo photo dekh sakta hai — sirf admin login wale hi nahi. Matlab **poori tarah private nahi hai**, chahe seedhe browser me kholne se koi random insaan usse dhoondh nahi payega, par agar link kahi share ho jaye to koi bhi khol sakta hai. Abhi ke liye MVP ke liye theek hai — jab scale badhega, isko zyada secure banane ke liye alag tarika (Cloud Functions se signed URL) chahiye hoga.

## Admin tab ab chhupa hua hai — sirf tumhare liye
Normal visitors (worker, employer) ko "Admin" tab bilkul nahi dikhega. Tum khud admin panel kholne ke liye is link ka use karo:

```
https://work-score-india-web.web.app/?panel=owner2026
```

Isi link ko **bookmark kar lo** — roz yehi kholna, "Admin" tab automatic dikh jayega.

**Agar chaho to secret word badal sakte ho** (`owner2026` ki jagah kuch aur): `src/App.jsx` file me `ADMIN_SECRET` line dhoondo, wahan naya word likho, GitHub par update karo. Naya word kisi ko mat batana — jitne kam log jaanein, utna surakshit.

**Yaad rakho:** Ye ek extra parda hai (obscurity), asli suraksha login (email+password) hi hai jo pehle se hai. Dono milke kaafi mazboot hai.

## Security Audit — poora imaandar summary (jab bhi review chahiye ho, yahi padho)

**✅ Mazboot hai:**
- Fake/duplicate registration block (mobile number hi document ID hai)
- Bina login (admin) koi data edit nahi kar sakta
- Extra/fake fields, galat format (mobile, naam, experience, photo) — sab reject hote hain, sirf app se nahi, **database (Firestore rules) level par bhi**
- Admin update me `mobile` field ab kabhi doc ID se mismatch nahi ho sakta (data corruption se bacha)
- Login brute-force block — 5 galat try ke baad lock, aur ab **page refresh karne se lockout hatta nahi** (session me save rehta hai)
- User ko kabhi raw/technical error kabhi nahi dikhta

**⚠️ Jaan-bujh kar adhoora chhoda hai (abhi is stage ke liye theek hai):**
- **"Secret admin link" (`?panel=owner2026`) — asli suraksha NAHI hai.** Ye word website ke JavaScript code me visible hai — koi bhi "View Source" karke 5 minute me dhoond sakta hai. **Isse sirf casual/normal logo se admin tab chhupta hai** — koi jaan-bujh kar dhoondhne wala isse aasani se bypass kar sakta hai. Lekin uske baad bhi use email+password login karna hi padega — **asli security wahi hai.**
- Aadhaar photo link poori tarah private nahi (jisके paas link jaye, wo dekh sakta hai)
- Real per-IP rate limiting nahi hai (Cloud Functions/Blaze-level feature chahiye)
- App Check (bot protection) on nahi hai

**Imaandar overall rating: chhote/naye startup (0-500 users) ke liye 80-85% — theek-thaak mazboot, overkill nahi, kamzor bhi nahi.** Jaise-jaise users/paisa badhega, upar wali "adhoori" list se ek-ek karke pakka karte rahenge.

## 20-Point Security Checklist — Final Status

**✅ Code se fix ho gaya (is zip me):**
1. Firestore `allow read/write: if true` — nahi hai, strict type/range rules hain
2. Storage — size/type limit hai (5MB, image-only)
3. Admin server-side bhi protected (sirf frontend nahi) — Firestore rules `request.auth` check karte hain
4. Service account JSON GitHub par kabhi upload nahi hua — sirf GitHub Secret me hai
5. Koi secret client-side code me nahi (sirf public-safe apiKey)
7. GitHub Secrets use ho rahe hain (`FIREBASE_SERVICE_ACCOUNT`)
11. User dusre ka data access nahi kar sakta (jo private hona chahiye) — public directory design hai, intentional
12. File upload size/type validate hota hai
15. Clickjacking/MIME-sniffing headers add kiye (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
16-17. Purane accounts/functions — N/A, naya project hai

**🔧 Code ready hai, sirf 1 free key chahiye (App Check setup):**
14. App Check ka code laga diya hai, **OFF hai jab tak tum key na daalo**:
1. Firebase console → left menu me **"App Check"** dhoondo
2. Apna web app select karo → **"reCAPTCHA v3"** provider chuno
3. Google isse ek **site key** dega — usko copy karo
4. `src/firebase.js` file me `RECAPTCHA_SITE_KEY` line dhoondo, wahan apna key paste karo
5. GitHub par update karo — App Check automatic ON ho jayega

**⚠️ Ye sirf Firebase/GitHub CONSOLE me hoti hain, code se nahi ho sakti — khud check/karo:**

| # | Kya karna hai | Kaha |
|---|---|---|
| 6 | Repo Private karo | GitHub → repo Settings → Danger Zone → Change visibility |
| 8 | Agar koi key kabhi leak ho, turant rotate karo | Firebase console → Project Settings → Service accounts |
| 9 | "Phone" sign-in method OFF karo (agar use nahi ho raha) | Authentication → Sign-in method |
| 10 | Apne Google account par 2FA ON karo | myaccount.google.com/security |
| 13 | Real per-IP rate limiting — abhi sirf client-side hai, backend (Blaze) chahiye | Baad me Cloud Functions se |
| 18 | Service account permissions review karo | console.cloud.google.com → IAM |
| 19 | Billing budget alert confirm karo laga hai ya nahi | console.cloud.google.com/billing → Budgets & alerts |
| 20 | Login/admin activity kabhi-kabhi manually dekho | Authentication → Users tab (last sign-in dikhta hai) |

## 🔴 CRITICAL FIX — Admin ab sirf tumhara account hi hai
Pehle koi bhi apna naya Firebase account bana ke "logged in" ban sakta tha aur admin jaisi permission le sakta tha. Ab rules me sirf **`usysknate@gmail.com`** wale account ko admin maana jayega.

**ZAROORI: Ye email tumhara ASLI admin email hai na, confirm karo.** Agar galat hai ya alag email use kar rahe ho, to `firestore.rules` file me ye line dhoondo:
```
return request.auth != null && request.auth.token.email == 'usysknate@gmail.com';
```
Aur `'usysknate@gmail.com'` ki jagah apna sahi email daalo — **warna khud bhi login nahi kar paoge.**

## Aadhaar photo — ab overwrite nahi ho sakti
Pehle koi bhi (bina login) kisi worker ki photo dobara upload karke purani replace kar sakta tha. Ab **ek baar photo upload hone ke baad, usi mobile number par dobara upload block hai.**

## 🔴 CRITICAL FIX — Aadhaar photo ab SIRF tumhare login se dikhegi
**Pehle jo bataya tha** ("link kisi ko mil jaye to dekh sakta hai") — uski asli wajah samajh aayi: Firebase ka download-link **hamesha ke liye kaam karta hai, Firestore/Storage rules ko bhi bypass kar deta hai** agar wo link kabhi leak ho jaye.

**Ab poora tarika badal diya:**
- App ab koi permanent link generate hi nahi karta
- Admin panel me photo dekhne ke liye button dabate hi, **tumhare live login se** photo fetch hoti hai (ek baar ke liye)
- Storage rules ab sirf tumhare email (`usysknate@gmail.com`) ko hi read permission dete hain — koi aur, kabhi bhi, kisi bhi link se, photo nahi dekh sakta

**Yaad rakho:** Ye email yahi hai jo Firestore rules me bhi hai — dono jagah **same hona zaroori hai**.

## Bada "Enterprise" Checklist — Imaandar Jawab (jo tumne bheja tha)

Wo list **bade companies (jaise banks, Swiggy) ke liye** hai jinke paas apna server, database, payment system, aur poori security team hoti hai. **Tumhara app Firebase-based hai (server khud nahi banaya)** — isliye bahut sa hissa waise applicable hi nahi hai, ya Firebase khud sambhal leta hai. Saaf-saaf:

**✅ Firebase khud sambhal leta hai (kuch karna nahi):**
- HTTPS/TLS — automatic hai
- Session/token security, refresh token rotation — Firebase Auth khud karta hai
- Password hashing — Firebase khud karta hai (tumhare paas raw password kabhi nahi aata)
- SQL Injection — N/A, humare paas SQL database hai hi nahi (Firestore alag tarah kaam karta hai)
- DDoS/Load balancer — Google Cloud infrastructure khud sambhalta hai

**✅ Tumhare app me already hai (maine laga diya):**
- Admin sirf tumhara account (isAdmin check)
- Har field ka type/range validation (create + update dono)
- File upload size/type limit
- Generic error messages (kabhi raw error nahi)
- Security headers (clickjacking se bachav)
- Photo ab sirf authenticated view se hi khulti hai

**⚠️ Is app ki size ke liye abhi zaroorat nahi (jab paisa/users badhein, tab):**
- MFA/2FA on admin — Blaze plan/Identity Platform chahiye
- Real per-IP rate limiting — Cloud Functions chahiye
- Automated backups — Blaze + scheduled export chahiye
- Audit logs/monitoring — Cloud Logging (Blaze) chahiye
- Dependency scanning — **YE FREE HAI, ABHI KAR SAKTE HO**: GitHub repo → Settings → "Code security" → **"Dependabot alerts" ON karo** — automatic batayega agar koi package purana/kamzor hai

**❌ Bilkul lagu nahi hota (is app me wo cheez hai hi nahi):**
- Payment security — koi payment nahi hai abhi
- Mobile app/APK security — abhi sirf website hai
- Employee/company IAM, SSO — tum akele ho, koi employee nahi
- SQL Injection, container security, WAF — humara architecture inse related nahi

## Important
- `src/firebase.js` me tumhara asli Firebase config already daala hua hai
- `firestore.rules` abhi sabko read+write allow karta hai (MVP ke liye) — jab users badhe, isko tighten karna padega (OTP verify ke baad hi write allow karna)
