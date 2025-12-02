import * as vscode from 'vscode';
import fetch from 'node-fetch';

// 🛡️ SÄKERHET: Svarta listan (Regex Guardrails)
// Dessa mönster stoppar de vanligaste försöken att "jailbreaka" modellen.
const SECURITY_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /ignore (all )?directions/i,
  /system prompt/i,
  /you are not/i,
  /dan mode/i, // "Do Anything Now" attack
  /jailbreak/i,
  /skriv en dikt/i, // Specifikt skydd mot dikt-attacker ;)
  /--- MALL SLUT ---/i, // Försök att fejka system-slut
  /simulera/i,
  /simulate/i, // English version of simulate attack
];

// 🧱 DoS-skydd: Max input length
const MAX_INPUT_LENGTH = 100000; // 100k tecken

// 🚦 Rate Limiting: Förhindrar resursmissbruk och DoS
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minut
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minut

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiter (per VS Code session)
let rateLimitStore: RateLimitEntry = {
  count: 0,
  resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
};

/**
 * 🚦 Rate Limiting: Kontrollerar om request får genomföras.
 */
function checkRateLimit(): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Reset om tidsfönstret har gått
  if (now >= rateLimitStore.resetTime) {
    rateLimitStore = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  // Kontrollera om gränsen är nådd
  if (rateLimitStore.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((rateLimitStore.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Öka räknaren
  rateLimitStore.count++;
  return { allowed: true };
}

/**
 * 🎨 MARKDOWN FORMATTING (Post-Processor)
 * Tar AI:ns textmassa och formaterar den till perfekt Markdown-struktur
 */
function formatMarkdown(text: string): string {
  let formatted = text;

  // 1. Rensa bort AI-skräp (system-läckage)
  formatted = formatted.replace(/--- MALL SLUT ---/gi, '');
  formatted = formatted.replace(/VIKTIGT:.*/gi, '');

  // 2. Fixa Huvudrubriken (### Status Update)
  // Ser till att den har en tom rad efter sig
  formatted = formatted.replace(/(###\s?Status Update)/i, '$1\n\n');

  // 3. Fixa Summary-blocket
  // Fångar: "> **Summary** [text]" och gör om till:
  // > **Summary**
  // > [text]
  formatted = formatted.replace(/>\s?\*\*Summary\*\*(.*?)(\*\*Context\*\*|$)/is, (match, content, nextPart) => {
    const cleanContent = content.trim().replace(/^>\s?/, ''); // Ta bort ev dubbla >
    return `> **Summary**\n> ${cleanContent}\n\n${nextPart || ''}`;
  });

  // 4. Fixa Context-rubriken
  // Sätter dubbla radbrytningar innan och en efter
  formatted = formatted.replace(/\*\*Context\*\*/i, '\n\n**Context**\n');

  // 5. Fixa Next Steps-rubriken
  // Sätter dubbla radbrytningar innan och en efter
  formatted = formatted.replace(/\*\*Next Steps\*\*/i, '\n\n**Next Steps**\n');

  // 6. Fixa Punktlistor (Detta är magin för "korv-problemet")
  // Om vi hittar en punkt (-) som INTE har en radbrytning innan sig, lägg till en.
  // Exempel: "Gör detta. - Gör ditten." -> "Gör detta.\n- Gör ditten."
  formatted = formatted.replace(/([^\n])\s+-\s/g, '$1\n- ');

  // 7. Städa upp överflödiga tomrader (max 2 st)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  return formatted.trim();
}

/**
 * 🚨 SSRF-Skydd: Validerar att URL:en är säker att använda.
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Endast http och https tillåtna
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Blockera farliga protokoll explicit
    const dangerousProtocols = ['file:', 'gopher:', 'ftp:', 'data:', 'javascript:'];
    if (dangerousProtocols.includes(parsed.protocol)) {
      return false;
    }

    // Validera hostname-struktur (förhindra SSRF via localhost-variationer)
    const hostname = parsed.hostname.toLowerCase();
    const allowedHosts = ['localhost', '127.0.0.1', '::1'];

    // Om det inte är localhost, kräv att det är en giltig domän
    if (!allowedHosts.includes(hostname)) {
      // Enkel validering: måste innehålla punkt (domän) eller vara IPv4/IPv6
      if (!hostname.includes('.') && !/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 🔍 Encoding Detection: Upptäcker base64 och andra encoding-försök.
 */
function detectEncoding(text: string): { isEncoded: boolean; type?: string } {
  // Base64 detection: Måste vara minst 4 tecken, endast base64-karaktärer, och ha rätt längd (multipel av 4)
  const base64Pattern = /^[A-Za-z0-9+/]{4,}={0,2}$/;
  const base64StrictPattern = /^[A-Za-z0-9+/]+={0,2}$/;
  
  // Om texten är för kort, är det troligen inte encoding
  if (text.length < 8) {
    return { isEncoded: false };
  }

  // Ta bort whitespace för att testa
  const cleaned = text.replace(/\s+/g, '');

  // Testa base64
  if (base64StrictPattern.test(cleaned) && cleaned.length % 4 === 0) {
    // Försök dekoda för att verifiera
    try {
      const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
      // Om dekodningen ger läsbar text, är det troligen base64
      if (decoded.length > 0 && /[\x20-\x7E]{3,}/.test(decoded)) {
        return { isEncoded: true, type: 'base64' };
      }
    } catch {
      // Inte giltig base64
    }
  }

  // URL encoding detection (2+ %XX-sekvenser är misstänkt)
  const urlEncodedPattern = /(%[0-9A-Fa-f]{2}){2,}/;
  if (urlEncodedPattern.test(text)) {
    return { isEncoded: true, type: 'url-encoded' };
  }
  
  // Ytterligare check: Om texten innehåller % och är misstänkt
  // (URL-encoding används ofta för att dölja attacker)
  if (text.includes('%') && text.match(/%[0-9A-Fa-f]{2}/)) {
    // Om det finns minst 1 %XX-sekvens, är det misstänkt
    return { isEncoded: true, type: 'url-encoded' };
  }

  return { isEncoded: false };
}

/**
 * 🛡️ Normaliserar input för att göra regex-detektion mer robust.
 * Eliminerar Unicode homoglyphs och obfuscation.
 */
function normalizeInput(text: string): string {
  // 1. Unicode-normalisering (NFKC): Konverterar kompatibla tecken till standardform
  // Detta konverterar t.ex. fullwidth 'Ａ' -> ASCII 'A', Fancy font '𝐇' -> ASCII 'H'
  // OBS: NFKC konverterar INTE alla homoglyphs (t.ex. Cyrillic 'о' och 'е' förblir)
  let normalized = text.normalize('NFKC');
  
  // 1.1. Explicit homoglyph-mapping för tecken som NFKC inte hanterar
  // Cyrillic och andra alfabet som ser ut som ASCII
  // Mappning baserad på visuell likhet och kontext
  const homoglyphMap: { [key: string]: string } = {
    // Cyrillic lowercase - viktiga tecken för vanliga attacker
    // Mappning baserad på VISUELL likhet (hur det ser ut), inte Unicode-betydelse
    '\u0456': 'i', // і (Cyrillic i, U+0456) -> i
    '\u043E': 'o', // о (Cyrillic o, U+043E) -> o
    '\u0435': 'e', // е (Cyrillic e, U+0435) -> e
    '\u0440': 'p', // р (Cyrillic r, U+0440) -> p (ser ut som p, används som p i attacker)
    '\u0432': 'v', // в (Cyrillic v, U+0432) -> v
    '\u0455': 's', // ѕ (Cyrillic s, U+0455) -> s
    '\u0441': 'c', // с (Cyrillic s, U+0441) -> c (ser ut som c, används som c i attacker)
    '\u043D': 'n', // н (Cyrillic n, U+043D) -> n
    '\u0442': 't', // т (Cyrillic t, U+0442) -> t
    '\u0443': 'u', // у (Cyrillic u, U+0443) -> u
    '\u0430': 'a', // а (Cyrillic a, U+0430) -> a
    '\u0445': 'x', // х (Cyrillic h, U+0445) -> x
    // Cyrillic uppercase
    '\u0410': 'A', '\u0415': 'E', '\u041E': 'O',
    '\u0420': 'P', '\u0421': 'C', '\u0423': 'Y', '\u0425': 'X',
    // Greek
    '\u03BF': 'o', '\u03B1': 'a', '\u03B5': 'e',
    // Fullwidth (borde hanteras av NFKC, men extra säkerhet)
    '\uFF41': 'a', '\uFF45': 'e', '\uFF4F': 'o',
  };
  
  for (const [homoglyph, ascii] of Object.entries(homoglyphMap)) {
    normalized = normalized.replace(new RegExp(homoglyph, 'g'), ascii);
  }

  // 2. Ta bort alla tecken som INTE är printable ASCII eller vanliga svenska tecken
  // Behåll: ASCII printable (0x20-0x7E) + svenska tecken (åäöÅÄÖ) + extended Latin
  // Regex: [\x20-\x7E] = printable ASCII, [\u00C0-\u00FF] = Latin-1 Supplement (åäö), [\u0100-\u017F] = Latin Extended-A
  // VIKTIGT: NFKC normalisering ovan ska redan ha konverterat homoglyphs, men vi tar bort resterande
  normalized = normalized.replace(/[^\x20-\x7E\u00C0-\u00FF\u0100-\u017F]/g, '');
  
  // Extra check: Om efter NFKC + filtrering finns det fortfarande icke-ASCII som ser ut som ASCII
  // (detta fångar fall där NFKC inte fungerade perfekt)
  // Kontrollera om det finns tecken som inte är i vår whitelist men ser ut som ASCII
  const suspiciousChars = normalized.match(/[^\x20-\x7E\u00C0-\u00FF\u0100-\u017F]/g);
  if (suspiciousChars && suspiciousChars.length > 0) {
    // Om vi hittar misstänkta tecken efter normalisering, ta bort dem
    normalized = normalized.replace(/[^\x20-\x7E\u00C0-\u00FF\u0100-\u017F]/g, '');
  }

  // 3. Konvertera till lowercase (efter Unicode-normalisering)
  normalized = normalized.toLowerCase();

  // 4. Byt ut leetspeak-tecken
  const leetspeakMap: { [key: string]: string } = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '@': 'a',
    '$': 's',
    '5': 's',
    '7': 't',
    '!': 'i',
  };

  for (const [leet, normal] of Object.entries(leetspeakMap)) {
    normalized = normalized.replace(new RegExp(leet, 'g'), normal);
  }

  // 5. Ta bort invisible characters och bidirectional marks - extra säkerhet
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  
  // 5.1. Bidirectional text detection och fix
  // Om texten innehåller RTL-marks, kan den vara baklänges - vänd den
  const hasRTL = /[\u202A-\u202E\u2066-\u2069]/.test(normalized);
  if (hasRTL) {
    // Ta bort RTL-marks
    normalized = normalized.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');
    // Vänd texten om den ser ut som baklänges (för att fånga RTL-attacker)
    // Vi vänder bara om texten innehåller vanliga engelska ord baklänges
    const reversed = normalized.split('').reverse().join('');
    // Kolla om den vända versionen är mer "normal" (innehåller vanliga ord)
    // Om den vända versionen matchar våra patterns bättre, använd den
    const commonWords = ['ignore', 'previous', 'instructions', 'system', 'prompt'];
    const originalHasWords = commonWords.some(word => normalized.toLowerCase().includes(word));
    const reversedHasWords = commonWords.some(word => reversed.toLowerCase().includes(word));
    
    // Om den vända versionen har fler vanliga ord, använd den
    if (reversedHasWords && !originalHasWords) {
      normalized = reversed;
    }
  } else {
    // Ta bort RTL-marks även om de inte finns (för säkerhet)
    normalized = normalized.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');
  }

  // 6. Normalisera whitespace (ersätt multiple spaces/tabs/newlines med single space)
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized.trim();
}

/**
 * Dörrvakten: Kollar om texten innehåller fientliga mönster.
 */
function validateInput(text: string): { safe: boolean; reason?: string } {
  // 1. Encoding detection först (innan normalisering)
  const encodingCheck = detectEncoding(text);
  if (encodingCheck.isEncoded) {
    return {
      safe: false,
      reason: `Security warning: Input appears to be ${encodingCheck.type}-encoded. Encoding attempts are not allowed.`,
    };
  }

  // 2. Normalisera input
  const normalized = normalizeInput(text);

  // 3. Kör regex-checken på normaliserad text
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        safe: false,
        reason: `Security warning: Input contains forbidden pattern`,
      };
    }
  }
  return { safe: true };
}

/**
 * 💰 ENTERPRISE LICENSE VALIDATION
 * V1 Logic: En enkel check. I framtiden kan vi ha en licensserver.
 */
function validateLicense(key: string): boolean {
  // En giltig nyckel måste börja med "ENT-" och vara minst 20 tecken.
  return !!(key && key.startsWith('ENT-') && key.length >= 20);
}

/**
 * Den centrala AI-bryggan.
 * Hanterar Konfig, Säkerhet, Timeout och Nätverk.
 */
export async function bridgeText(
  userText: string,
  systemPrompt: string
): Promise<string> {
  // 0. 🚦 RATE LIMITING: Kontrollera först (sparar resurser)
  const rateLimitCheck = checkRateLimit();
  if (!rateLimitCheck.allowed) {
    return `⚠️ Too many requests. Please wait ${rateLimitCheck.retryAfter} seconds before trying again.`;
  }

  // 1. 🧱 DoS-SKYD: Kontrollera input-längd
  if (userText.length > MAX_INPUT_LENGTH) {
    return `⚠️ Input too large. Maximum ${MAX_INPUT_LENGTH} characters allowed.`;
  }

  // 2. 🛡️ SÄKERHETSCHECK (Input Sanitization)
  // Vi stoppar attacken innan den ens når AI-servern (sparar CPU).
  const securityCheck = validateInput(userText);
  if (!securityCheck.safe) {
    console.warn(`[Bridge Security] Blocked input: ${securityCheck.reason}`);
    return `⛔ ${securityCheck.reason}. Request blocked for security reasons.`;
  }

  // 3. ⚙️ HÄMTA KONFIGURATION (Enterprise Compliance)
  // Detta gör att företag kan peka om URL:en till en intern server via Group Policy.
  const config = vscode.workspace.getConfiguration('bridge');
  const apiBaseUrl =
    config.get<string>('apiBaseUrl') || 'http://localhost:11434'; // Default: Localhost
  const model = config.get<string>('model') || 'mistral'; // Default: Mistral (stabilare än llama3.2)
  const licenseKey = config.get<string>('licenseKey') || '';

  // 3.1. 🚨 SSRF-SKYD: Validera URL innan användning
  if (!isValidUrl(apiBaseUrl)) {
    console.error(`[Bridge Security] Invalid API URL blocked: ${apiBaseUrl}`);
    return `⛔ Invalid API URL configured. Please contact your administrator.`;
  }

  // 3.2. 💰 ENTERPRISE CHECK (The Money Maker)
  // Normalisera URL för att undvika bypass (t.ex. http://localhost.evil.com)
  let isLocal = false;
  try {
    const urlObj = new URL(apiBaseUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const localhostVariants = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    isLocal = localhostVariants.includes(hostname);
  } catch (e) {
    return '❌ Invalid URL configuration.';
  }

  if (!isLocal) {
    if (!validateLicense(licenseKey)) {
      return `🔒 **ENTERPRISE FEATURE LOCKED**\n\nConnecting to a remote AI server (${apiBaseUrl}) requires an Enterprise License.\n\n**To unlock:** Contact daniel@postboxen.se for a license key.\n\n**Free mode:** Reset 'bridge.apiBaseUrl' to 'http://localhost:11434'.`;
    }
  }

  // 4. ⏱️ TIMEOUT (Driftsäkerhet)
  // Vi ger AI:n max 60 sekunder på sig. Annars avbryter vi så inte VS Code hänger sig.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 sekunder

  try {
    const response = await fetch(`${apiBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: model,
              system: systemPrompt, // Här skickar vi med Ghostwriter-prompten
              prompt: userText, // Användarens (saniterade) text - modellen vet att den ska basera allt på detta
              stream: false, // Vi vill ha hela svaret på en gång (enklare hantering)
              options: {
                temperature: 0.1, // 🧊 LÅG TEMP = Deterministisk, professionell, inga hallucinationer.
                num_ctx: 4096, // Kontextfönster (så den minns längre texter)
              },
            }),
      signal: controller.signal, // Koppla timeout-signalen till anropet
    });

    clearTimeout(timeoutId); // Stoppa timern om vi fick svar i tid

    if (!response.ok) {
      throw new Error(`Server responded with HTTP ${response.status}`);
    }

    const data = await response.json();

    // 5. 🧹 OUTPUT SANITIZATION (Städning)
    // Ibland (sällan) läcker modellen ut interna instruktioner. Vi klipper bort dem.
    let cleanResponse = (data.response || '').trim();

    // Unicode-normalisering på output också (för säkerhet)
    cleanResponse = cleanResponse.normalize('NFKC');

    // Ta bort saker som modellen inte borde ha skrivit ut
    cleanResponse = cleanResponse.replace(/--- MALL SLUT ---/gi, '');
    cleanResponse = cleanResponse.replace(/VIKTIGT:.*/gi, '');
    cleanResponse = cleanResponse.replace(/REGLER:.*/gi, '');
    cleanResponse = cleanResponse.replace(/SÄKERHETSPROTOKOLL:.*/gi, '');
    cleanResponse = cleanResponse.replace(/SÄKERHETSINSTRUKTION:.*/gi, '');

    // 5.1. 🧹 AGGRESSIV STÄDNING (The Chatty Killer)
    // Ta bort vanliga inledningsfraser som lokala modeller älskar
    const prefixesToRemove = [
      /^Here'?s a (polished|suggested|revised) version:?/i,
      /^Here is the (polished|translated) text:?/i,
      /^Sure,? (here is|I can help).*:?/i,
      /^I have (rewritten|corrected|polished).*:?/i,
      /^Output:?/i,
      /^Translation:?/i,
      /^Här är (ett förslag|den polerade versionen):?/i,
      /^Jag har (omskrivit|korrigerat|polerat).*:?/i,
    ];

    prefixesToRemove.forEach(rx => {
      cleanResponse = cleanResponse.replace(rx, '').trim();
    });

    // Ta bort citattecken i början och slut om hela texten är inom dem
    if (cleanResponse.startsWith('"') && cleanResponse.endsWith('"')) {
      cleanResponse = cleanResponse.slice(1, -1);
    }

    // 5.3. 🧹 NEGATIV TON-STÄDNING (The Positivity Filter)
    // Ta bort passivt aggressiva och negativa fraser
    const negativePhrases = [
      /\bto avoid (such |any |potential )?issues?\b/gi,
      /\bto prevent future problems?\b/gi,
      /\bso this doesn't happen again\b/gi,
      /\bfor future usage\b/gi,
      /\bto ensure future stability\b/gi,
      /\bto address these concerns\b/gi,
      /\bnegatively impacts?\b/gi,
      /\bnegatively affects?\b/gi,
      /\bin the future\b/gi, // Ofta används i negativ kontext
      /\bto avoid any potential\b/gi,
      /\bensure optimal performance in the future\b/gi,
    ];

    negativePhrases.forEach(rx => {
      cleanResponse = cleanResponse.replace(rx, '').trim();
    });

    // Ta bort onödiga fraser och meningar
    const unnecessaryPhrases = [
      /\bLet me know if.*?\./gi,
      /\bPlease note that.*?\./gi,
      /\bIf you have any (questions|concerns|requirements).*?\./gi,
      /\bduring this (optimization|process|work).*?\./gi,
      /\bThank you for bringing.*?\./gi,
      /\bI look forward to.*?\./gi,
      /\bI understand that.*?\./gi,
      /\bto minimize any potential impact\b/gi,
      /\bso I can address them promptly\b/gi,
    ];

    unnecessaryPhrases.forEach(rx => {
      cleanResponse = cleanResponse.replace(rx, '').trim();
    });

    // Ta bort "designed database table" → "database schema"
    cleanResponse = cleanResponse.replace(/\bdesigned database table\b/gi, 'database schema');

    // Ta bort "table design" och ersätt med "database schema" om det finns
    cleanResponse = cleanResponse.replace(/\btable'?s? design\b/gi, 'database schema');
    cleanResponse = cleanResponse.replace(/\btable structure\b/gi, 'database schema');
    
    // Rensa upp dubbel-mellanslag och punkt-punkt
    cleanResponse = cleanResponse.replace(/\s+/g, ' ').replace(/\.\.+/g, '.').trim();

    // 5.2. 🛡️ CONTENT MODERATION (The Safety Net)
    // Blockera kända problematiska termer i output (sista försvarslinjen)
    const harmfulPatterns = [
      // Historiska diktatorer/krigsförbrytare (i hyllande kontext)
      /\b(hitler|nazi|holocaust.*denial|genocide.*justified)\b/i,
      // Extremistiska ideologier (i positiv kontext)
      /\b(white.*supremacy|racial.*superiority|ethnic.*cleansing)\b/i,
      // Våldsbejakande innehåll
      /\b(kill.*all|exterminate.*group|violence.*against.*minority)\b/i,
    ];

    // Om output innehåller problematiskt innehåll, blockera det
    for (const pattern of harmfulPatterns) {
      if (pattern.test(cleanResponse)) {
        console.warn('[Bridge Security] Blocked harmful content in output');
        return '⚠️ This content cannot be processed as it contains inappropriate material.';
      }
    }

    // 5.4. 🎨 MARKDOWN FORMATTING (Post-Processor)
    // Låt koden hantera strukturen istället för att förlita sig på AI:n
    cleanResponse = formatMarkdown(cleanResponse);

    return cleanResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // 🔒 Information Disclosure: Logga detaljer för debug, men visa generiskt fel för användaren
    console.error('Bridge Error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      apiBaseUrl: apiBaseUrl, // Logga URL för debug
    });

    // Snygg felhantering för användaren (utan känslig info)
    if (error.name === 'AbortError') {
      return '⚠️ Timeout: The AI model did not respond within 60 seconds. Is your computer under heavy load or is the model too large?';
    }

    // Hantera anslutningsfel (vanligast) - generiskt meddelande
    if (error.code === 'ECONNREFUSED') {
      return `❌ Could not connect to the configured AI server.\n\nTip: Make sure the AI service is running.`;
    }

    // Generiskt felmeddelande för användaren
    return `❌ An error occurred while communicating with the AI server. Please check your configuration.`;
  }
}
