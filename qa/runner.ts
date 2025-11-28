import fetch from 'node-fetch';
import { TEST_CASES } from './dataset';
import * as fs from 'fs';
import * as path from 'path';

// Super Prompt (Ghostwriter version - uppdaterad med Anti-Hallucination Guard)
function buildDiplomatPrompt(targetLang: string): string {
  const langInstruction =
    targetLang === 'Swedish' ? 'Svenska.' : 'English (Tech Standard).';

  return `Du är en Expert Tech Ghostwriter.

Din uppgift är att polera utvecklarens råa text.

MÅLSPRÅK: ${langInstruction}

VIKTIGA REGLER:

1. **PERSPEKTIV:** Skriv alltid som "Jag" eller "Vi".

2. **TON:** Professionell, lugn, tekniskt korrekt.

3. **FORMAT:** Använd mallen nedan exakt.

⛔ HALLUCINATION GUARD (VIKTIGT):

- Du får **ALDRIG** hitta på tekniska detaljer som inte nämns i input.
- Om användaren pratar om "CSS", skriv INTE om "Redux".
- Om användaren pratar om "Bilder", skriv INTE om "Databaser".
- Håll dig strikt till ämnet i input-texten.

--- MALL ---

### 💬 Status Update

> **Summary**
> (En mening.)

**Context**
(Förklaring.)

**Next Steps**
- (Åtgärder.)

--- MALL SLUT ---

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
  
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
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
    return {
      response: `ERROR: ${error.message}`,
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

    console.log(`Processing ${id}/50...`);
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

    // Cool-down: Vänta 2 sekunder innan nästa anrop
    if (i < TEST_CASES.length - 1) {
      console.log('⏳ Cooling down (2s)...\n');
      await sleep(2000);
    }
  }

  // Spara resultat
  const outputPath = path.join(process.cwd(), 'qa', 'qa_results.json');
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

