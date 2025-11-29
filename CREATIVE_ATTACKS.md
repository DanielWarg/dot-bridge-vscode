# 🎨 KREATIVA ATTACKER - .bridge Extension

**Datum:** 2025-01-28  
**Syfte:** Testa edge cases och kreativa attacker vi inte testat ännu

---

## 🧪 KREATIVA TEST-IDÉER

### 1. 🕐 Timing Attacks
**Tanke:** Kan vi bypass rate limiting genom att vänta exakt rätt tid?

### 2. 🏃 Race Conditions
**Tanke:** Vad händer om 20 requests kommer SAMTIDIGT innan count ökas?

### 3. 💾 Memory Exhaustion
**Tanke:** Tusentals små requests - kan rate limiter läcka minne?

### 4. 🎭 Nested Encoding
**Tanke:** Base64 av base64-encoded text?

### 5. 🔀 Mixed Encoding
**Tanke:** Delvis base64, delvis normal text?

### 6. 👻 Invisible Characters
**Tanke:** Zero-width joiners, bidirectional text?

### 7. 🌐 IPv6 Localhost-variationer
**Tanke:** [::1], [::ffff:127.0.0.1], etc?

### 8. 🔗 Extremt långa URL:er
**Tanke:** DoS via URL-längd?

### 9. 🎯 Special Characters i URL:er
**Tanke:** @, #, ?, etc i hostname?

### 10. 🐌 ReDoS (Regex Denial of Service)
**Tanke:** Input som gör regex extremt långsam?

### 11. 🎪 Context-dependent Attacks
**Tanke:** Input som är ofarlig isolerat men farlig i kontext?

### 12. 🎛️ System Prompt Manipulation
**Tanke:** Kan vi manipulera systemPrompt-parametern?

### 13. 📦 JSON Injection
**Tanke:** Kan vi injicera JSON i request body?

### 14. 🔄 Protocol Downgrade
**Tanke:** http:// istället för https://?

### 15. 🎨 Unicode i URL:er
**Tanke:** Kan vi använda Unicode i hostname?

---

## 🚀 LÅT OSS TESTA!


