/**
 * Direct prompt test - Tests the prompt directly against Ollama
 * to verify the updated prompt is working correctly
 */

import fetch from 'node-fetch';
import { buildDiplomatPrompt } from '../src/prompts/diplomat';

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'mistral';

async function testPrompt() {
  const testInput = 'Vem fan designade den här tabellen? Den saknar index och sänker hela prod så fort vi får trafik. Jag måste sitta hela helgen och skriva om skiten för att ni inte fattar vad prestanda är.';
  const targetLang = 'English';

  console.log('🧪 Testing prompt directly against Ollama...\n');
  console.log('📝 Test Input:');
  console.log(`   "${testInput}"\n`);

  // Build the prompt
  const systemPrompt = buildDiplomatPrompt(testInput, targetLang);

  console.log('📋 System Prompt (first 500 chars):');
  console.log('   ' + systemPrompt.substring(0, 500) + '...\n');

  try {
    console.log('🔄 Sending request to Ollama...\n');

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: testInput,
        system: systemPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { response: string };

    console.log('✅ Response received!\n');
    console.log('📤 Output:');
    console.log('─'.repeat(80));
    console.log(data.response);
    console.log('─'.repeat(80));
    console.log('');

    // Check for problematic phrases
    const output = data.response.toLowerCase();
    const problems: string[] = [];
    const goodSigns: string[] = [];

    if (output.includes('difficult to navigate') || output.includes('hard to navigate')) {
      problems.push('❌ Contains "difficult/hard to navigate" (UI interpretation)');
    }
    if (output.includes('table navigation')) {
      problems.push('❌ Contains "table navigation" (UI interpretation)');
    }
    if (!output.includes('database') && !output.includes('schema') && !output.includes('index')) {
      problems.push('❌ Missing database-related terms');
    }
    if (output.includes('database') || output.includes('schema') || output.includes('sql')) {
      goodSigns.push('✅ Contains database-related terms');
    }
    if (output.includes('dedicate') || output.includes('prioritize') || output.includes('weekend')) {
      goodSigns.push('✅ Contains professional time commitment phrasing');
    }
    if (output.includes('status update') || output.includes('summary') || output.includes('context')) {
      goodSigns.push('✅ Contains Status Update structure');
    }

    console.log('🔍 Analysis:');
    if (goodSigns.length > 0) {
      goodSigns.forEach(s => console.log(`   ${s}`));
    }
    if (problems.length > 0) {
      console.log('');
      problems.forEach(p => console.log(`   ${p}`));
    }
    if (problems.length === 0 && goodSigns.length > 0) {
      console.log('');
      console.log('   🎉 Prompt appears to be working correctly!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testPrompt().catch(console.error);

