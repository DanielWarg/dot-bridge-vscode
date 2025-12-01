import fetch from 'node-fetch';
import { TEST_CASES } from './test_extended_universal';
import * as fs from 'fs';
import * as path from 'path';

// Universal Prompt (samma som i src/prompts/diplomat.ts - UPDATED VERSION)
function buildDiplomatPrompt(targetLang: string): string {
  const langInstruction = targetLang === 'Swedish' 
    ? 'Svenska (Professionell, affärsmässig ton).'
    : 'English (Standard Tech English).';

  return `
Du är en text-processnings-motor. INTE en chattbot.

Din enda uppgift är att skriva om input-texten.

MÅLSPRÅK: ${langInstruction}

REGLER FÖR UTMATNING (ABSOLUTA):

1. **INGET PRAT:** Skriv ALDRIG "Här är förslaget", "Jag har ändrat...", "Here is the polished version".

2. **INGA CITATTECKEN:** Omslut inte resultatet i "".

3. **REN TEXT:** Returnera ENDAST den färdiga texten. Inget annat.

REGLER FÖR INNEHÅLL:

1. **BEVARANDE:** Behåll betydelsen. Lägg inte till nya fakta (som PRs eller lösningar).

2. **TON:** Gör det professionellt och rakt. Ta bort ilska.

3. **PERSPEKTIV:** Skriv som "Jag" eller "Vi".

EXEMPEL PÅ GODKÄND OUTPUT:

Input: "Koden suger, fixa det."

Output: "Koden uppfyller inte våra kvalitetskrav och behöver åtgärdas."

EXEMPEL PÅ FÖRBJUDEN OUTPUT (GÖR INTE SÅ HÄR):

Input: "Koden suger."

Output: "Här är ett förslag: Koden uppfyller inte..." (FEL! Inget prat.)

INPUT ATT BEARBETA:
`;
}

// Använd English som default för QA-testet
const SUPER_PROMPT = buildDiplomatPrompt('English');

interface QAResult {
  id: number;
  input: string;
  inputLength: number;
  inputWordCount: number;
  category: string;
  output: string;
  outputLength: number;
  outputWordCount: number;
  latency_ms: number;
  timestamp: string;
}

function categorizeInput(input: string): string {
  const wordCount = input.split(' ').length;
  const lowerInput = input.toLowerCase();
  
  if (wordCount <= 10) return 'Short';
  if (wordCount <= 30) return 'Medium';
  if (wordCount <= 100) return 'Long';
  return 'Very Long';
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOllama(input: string): Promise<{ response: string; latency_ms: number }> {
  const startTime = Date.now();
  
  // Timeout efter 90 sekunder
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout after 90 seconds')), 90000);
  });
  
  try {
    const fetchPromise = fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        system: SUPER_PROMPT,
        prompt: input,
        stream: false,
        options: {
          temperature: 0.1,
          num_ctx: 4096,
        },
      }),
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const latency_ms = Date.now() - startTime;
    
    return {
      response: (data.response || '').trim(),
      latency_ms,
    };
  } catch (error: any) {
    const latency_ms = Date.now() - startTime;
    
    if (error.message && error.message.includes('Timeout')) {
      return {
        response: `ERROR: Timeout after 90 seconds`,
        latency_ms,
      };
    }
    
    return {
      response: `ERROR: ${error.message || 'Unknown error'}`,
      latency_ms,
    };
  }
}

async function runQA(): Promise<void> {
  console.log('🚀 Starting Extended Universal Prompt QA Suite...\n');
  console.log(`📊 Total test cases: ${TEST_CASES.length}\n`);

  const results: QAResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    
    // Skip empty inputs
    if (!testCase || testCase.trim() === '') {
      console.log(`⏭️  Skipping empty test case ${i + 1}\n`);
      continue;
    }
    
    const id = i + 1;
    const category = categorizeInput(testCase);
    const wordCount = testCase.split(' ').length;

    console.log(`Processing ${id}/${TEST_CASES.length} [${category}, ${wordCount} words]...`);
    console.log(`Input: ${testCase.substring(0, 80)}${testCase.length > 80 ? '...' : ''}`);

    const { response, latency_ms } = await callOllama(testCase);

    const result: QAResult = {
      id,
      input: testCase,
      inputLength: testCase.length,
      inputWordCount: wordCount,
      category,
      output: response,
      outputLength: response.length,
      outputWordCount: response.split(' ').length,
      latency_ms,
      timestamp: new Date().toISOString(),
    };

    results.push(result);

    console.log(`✅ Completed in ${latency_ms}ms`);
    console.log(`   Output: ${response.substring(0, 80)}${response.length > 80 ? '...' : ''}\n`);
    
    // Spara resultat efter varje test
    const projectRoot = process.cwd().endsWith('qa') 
      ? path.join(process.cwd(), '..')
      : process.cwd();
    const outputPath = path.join(projectRoot, 'qa', 'extended_universal_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Progress saved (${results.length}/${TEST_CASES.length})\n`);

    // Cool-down: Vänta 3 sekunder
    if (i < TEST_CASES.length - 1) {
      console.log('⏳ Cooling down (3s)...\n');
      await sleep(3000);
    }
  }

  // Final save
  const projectRoot = process.cwd().endsWith('qa') 
    ? path.join(process.cwd(), '..')
    : process.cwd();
  const outputPath = path.join(projectRoot, 'qa', 'extended_universal_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('✅ Extended Universal Prompt QA Suite completed!');
  console.log(`📁 Results saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Average latency: ${Math.round(results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length)}ms`);
  console.log(`   Errors: ${results.filter(r => r.output.startsWith('ERROR:')).length}`);
  console.log(`\n📈 By Category:`);
  const byCategory = results.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
}

// Kör QA-sviten
runQA().catch((error) => {
  console.error('❌ QA Suite failed:', error);
  process.exit(1);
});

