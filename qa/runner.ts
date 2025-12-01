import fetch from 'node-fetch';
import { TEST_CASES } from './dataset';
import * as fs from 'fs';
import * as path from 'path';

// Universal Prompt (enkel version - ingen format detection)
function buildDiplomatPrompt(targetLang: string): string {
  const langInstruction = targetLang === 'Swedish' 
    ? 'Svenska (Professionell, affärsmässig ton).'
    : 'English (Standard Tech English).';

  return `
Du är en Expert Tech Communicator.

Din uppgift är att polera och översätta texten nedan så att den blir professionell, tydlig och empatisk.

MÅLSPRÅK: ${langInstruction}

INSTRUKTIONER:

1. **Analysera:** Förstå kärnbudskapet. Input kan vara slarvig, arg eller "svengelska".

2. **Polera:** 

   - Rätta grammatik och stavning.

   - Byt ut aggressivt språk mot lösningsorienterat språk.

   - Behåll tekniska termer (t.ex. "Deploy", "Bugfix", "Pull Request").

3. **Format:**

   - Behåll originalets struktur (om det ser ut som ett mail, behåll mail-formatet. Om det är en lista, behåll listan).

   - Inga inledande fraser ("Här är din text..."). Bara resultatet.

4. **Perspektiv:** Skriv alltid som "Jag" eller "Vi".

5. **Sanning:** Hitta ALDRIG på tekniska detaljer (Inga gissningar om Redux/Databaser om det inte nämns).

EXEMPEL PÅ TON:

Input: "Fixa skiten, det kraschar."

Output: "Vi behöver åtgärda problemet omgående då det orsakar krascher."

INPUT ATT BEARBETA:
`;
}

// Använd English som default för QA-testet
const SUPER_PROMPT = buildDiplomatPrompt('English');

interface QAResult {
  id: number;
  input: string;
  output: string;
  latency_ms: number;
  timestamp: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOllama(input: string): Promise<{ response: string; latency_ms: number }> {
  const startTime = Date.now();
  
  // Timeout efter 90 sekunder (använd Promise.race för node-fetch v2)
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
  console.log('🚀 Starting QA Suite...\n');
  console.log(`📊 Total test cases: ${TEST_CASES.length}\n`);

  const results: QAResult[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const id = i + 1;

    console.log(`Processing ${id}/${TEST_CASES.length}...`);
    console.log(`Input: ${testCase.substring(0, 60)}...`);

    const { response, latency_ms } = await callOllama(testCase);

    const result: QAResult = {
      id,
      input: testCase,
      output: response,
      latency_ms,
      timestamp: new Date().toISOString(),
    };

    results.push(result);

    console.log(`✅ Completed in ${latency_ms}ms\n`);
    
    // Spara resultat efter varje test (så vi inte förlorar data om det fastnar)
    const projectRoot = process.cwd().endsWith('qa') 
      ? path.join(process.cwd(), '..')
      : process.cwd();
    const outputPath = path.join(projectRoot, 'qa', 'qa_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`💾 Progress saved (${results.length}/${TEST_CASES.length})\n`);

    // Cool-down: Vänta 3 sekunder innan nästa anrop
    if (i < TEST_CASES.length - 1) {
      console.log('⏳ Cooling down (3s)...\n');
      await sleep(3000);
    }
  }

  // Final save (redundant men säkert)
  const projectRoot = process.cwd().endsWith('qa') 
    ? path.join(process.cwd(), '..')
    : process.cwd();
  const outputPath = path.join(projectRoot, 'qa', 'qa_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('✅ QA Suite completed!');
  console.log(`📁 Results saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Average latency: ${Math.round(results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length)}ms`);
  console.log(`   Errors: ${results.filter(r => r.output.startsWith('ERROR:')).length}`);
}

// Kör QA-sviten
runQA().catch((error) => {
  console.error('❌ QA Suite failed:', error);
  process.exit(1);
});
