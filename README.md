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

## Important
- `src/firebase.js` me tumhara asli Firebase config already daala hua hai
- `firestore.rules` abhi sabko read+write allow karta hai (MVP ke liye) — jab users badhe, isko tighten karna padega (OTP verify ke baad hi write allow karna)
