import fetch from 'node-fetch';
import { EMAIL_TEST_CASES } from './dataset_email';
import * as fs from 'fs';
import * as path from 'path';

// Super Prompt (Ghostwriter version - uppdaterad med Anti-Hallucination Guard)
function buildDiplomatPrompt(targetLang: string): string {
  const langInstruction =
    targetLang === 'Swedish' ? 'Svenska.' : 'English (Tech Standard).';

  return `Du är en Expert Tech Ghostwriter.

Din uppgift är att skriva om min text till professionell kommunikation.

MÅLSPRÅK: ${langInstruction}

VIKTIGA REGLER (FÖLJ SLAVISKT):

1. **ANALYS:** Avgör först om detta är en **Statusuppdatering** (Slack/Jira/Team) eller ett **Email** (Formellt/Externt/Långt).

2. **VAL:** Välj *en* av mallarna nedan. Använd ALDRIG båda.

3. **PERSPEKTIV:** Skriv alltid som "Jag" eller "Vi".

4. **SANNING:** Hitta ALDRIG på tekniska detaljer (Inga gissningar om Redux/Databaser om det inte nämns).

--- MALL A: OM DET ÄR ETT EMAIL ---

Subject: [Kort, tydligt ämne]

[Hälsningsfras, t.ex. Hi Team / Dear Customer,]

[Brödtext: Professionell, artig och tydlig. Använd stycken.]

Regards,
[Your Name]

------------------------------------

--- MALL B: OM DET ÄR EN STATUSUPPDATERING (Default) ---

### 💬 Status Update

> **Summary**
> (En kärnfull mening.)

**Context**
(Förklaring.)

**Next Steps**
- (Åtgärder.)

-------------------------------------------------------

INPUT ATT BEARBETA:
`;
}

// Använd English som default för QA-testet
const SUPER_PROMPT = buildDiplomatPrompt('English');

interface EmailQAResult {
  id: number;
  input: string;
  output: string;
  latency_ms: number;
  timestamp: string;
  hasEmailFormat: boolean;
  hasSubject: boolean;
  hasGreeting: boolean;
  hasClosing: boolean;
}

async function callOllama(input: string): Promise<{ response: string; latency_ms: number }> {
  const startTime = Date.now();

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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const latency = Date.now() - startTime;

  return {
    response: data.response || '',
    latency_ms: latency,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function analyzeEmailFormat(output: string): {
  hasEmailFormat: boolean;
  hasSubject: boolean;
  hasGreeting: boolean;
  hasClosing: boolean;
} {
  const lower = output.toLowerCase();
  
  // Kolla om det ser ut som ett email (inte bara status update)
  const hasEmailFormat = 
    lower.includes('subject:') || 
    lower.includes('to:') || 
    lower.includes('dear') || 
    lower.includes('hej') ||
    lower.includes('best regards') ||
    lower.includes('med vänliga hälsningar') ||
    lower.includes('sincerely');

  const hasSubject = lower.includes('subject:');
  const hasGreeting = lower.includes('dear') || lower.includes('hej') || lower.includes('hi');
  const hasClosing = 
    lower.includes('best regards') || 
    lower.includes('sincerely') || 
    lower.includes('med vänliga hälsningar') ||
    lower.includes('m.v.h.');

  return {
    hasEmailFormat,
    hasSubject,
    hasGreeting,
    hasClosing,
  };
}

async function runEmailQA(): Promise<void> {
  console.log('📧 Starting Email Stress Test Suite...\n');
  console.log(`📊 Total email test cases: ${EMAIL_TEST_CASES.length}\n`);

  const results: EmailQAResult[] = [];

  for (let i = 0; i < EMAIL_TEST_CASES.length; i++) {
    const testCase = EMAIL_TEST_CASES[i];
    const id = i + 1;

    console.log(`Processing ${id}/10...`);
    console.log(`Input: ${testCase.substring(0, 80)}...`);

    const { response, latency_ms } = await callOllama(testCase);

    const emailAnalysis = analyzeEmailFormat(response);

    const result: EmailQAResult = {
      id,
      input: testCase,
      output: response,
      latency_ms,
      timestamp: new Date().toISOString(),
      ...emailAnalysis,
    };

    results.push(result);

    console.log(`✅ Completed in ${latency_ms}ms`);
    console.log(`   Email format: ${emailAnalysis.hasEmailFormat ? '✅' : '❌'}`);
    console.log(`   Has subject: ${emailAnalysis.hasSubject ? '✅' : '❌'}`);
    console.log('');

    // Cool-down: Vänta 2 sekunder innan nästa anrop
    if (i < EMAIL_TEST_CASES.length - 1) {
      console.log('⏳ Cooling down (2s)...\n');
      await sleep(2000);
    }
  }

  // Spara resultat
  const outputPath = path.join(process.cwd(), 'qa', 'qa_results_email.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  // Analysera resultat
  const emailFormatCount = results.filter(r => r.hasEmailFormat).length;
  const subjectCount = results.filter(r => r.hasSubject).length;
  const greetingCount = results.filter(r => r.hasGreeting).length;
  const closingCount = results.filter(r => r.hasClosing).length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length;

  console.log('✅ Email Stress Test completed!');
  console.log(`📁 Results saved to: ${outputPath}\n`);
  console.log('📊 Summary:');
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Email format detected: ${emailFormatCount}/${results.length} (${Math.round(emailFormatCount/results.length*100)}%)`);
  console.log(`   Has subject line: ${subjectCount}/${results.length} (${Math.round(subjectCount/results.length*100)}%)`);
  console.log(`   Has greeting: ${greetingCount}/${results.length} (${Math.round(greetingCount/results.length*100)}%)`);
  console.log(`   Has closing: ${closingCount}/${results.length} (${Math.round(closingCount/results.length*100)}%)`);
  console.log(`   Average latency: ${Math.round(avgLatency)}ms`);
  console.log('');

  // Varning om låg email-format detection
  if (emailFormatCount < results.length * 0.7) {
    console.log('⚠️  WARNING: Less than 70% of outputs have email format!');
    console.log('   The prompt might be treating emails as status updates.');
  }
}

runEmailQA().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

