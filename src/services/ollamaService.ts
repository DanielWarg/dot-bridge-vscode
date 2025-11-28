import * as vscode from 'vscode';
import fetch from 'node-fetch';

interface OllamaResponse {
  response: string;
}

export async function bridgeText(
  userText: string,
  systemPrompt: string
): Promise<string> {
  try {
    // Läs modellnamn från konfiguration
    const config = vscode.workspace.getConfiguration('bridge');
    const model = config.get<string>('model', 'mistral');

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: userText,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.1, // LÅG temperatur = mindre hittepå, mer stabil svenska
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as OllamaResponse;
    return data.response;
  } catch (error) {
    throw new Error('❌ Could not connect to local AI. Is Ollama running?');
  }
}

