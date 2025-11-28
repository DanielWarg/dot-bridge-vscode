# Plan: VS Code Extension ".bridge"

## Projektstruktur

Skapa följande filstruktur:

```
dot-bridge-vscode/
├── .vscode/
│   └── launch.json (för debugging extension)
├── .vscodeignore
├── .gitignore
├── package.json (VS Code extension manifest)
├── tsconfig.json
├── README.md
├── src/
│   ├── extension.ts (huvudentry point)
│   ├── services/
│   │   └── ollamaService.ts (Ollama API-integration)
│   └── prompts/
│       └── diplomat.ts (system prompts)
└── agent.md (uppdatera med projektinfo)
```

## Implementation

### 1. package.json
- Extension metadata: name ".bridge", displayName ".bridge - Developer Tone Translator"
- Activation events: `onCommand:bridge.diplomat`, `onCommand:bridge.techspec`
- Commands:
  - `bridge.diplomat` (title: "Bridge: Socialize Text")
  - `bridge.techspec` (title: "Bridge: Generate Tech Spec")
- Keybindings: `cmd+shift+B` / `ctrl+shift+B` → `bridge.diplomat`
- Configuration:
  - `contributes.configuration` med title ".bridge"
  - Property `bridge.model`: type "string", default "llama3.2", description "Namnet på Ollama-modellen (t.ex. llama3.2, mistral, qwen2.5-coder)"
- Dependencies: `@types/vscode`, `@types/node`, `node-fetch`, `@types/node-fetch`
- Scripts: `compile`, `watch`, `package`

### 2. src/services/ollamaService.ts
- Funktion `bridgeText(userText: string, systemPrompt: string): Promise<string>`
- Läs modellnamn från konfiguration: `vscode.workspace.getConfiguration('bridge').get<string>('model', 'llama3.2')`
- POST till `http://localhost:11434/api/generate`
- Request body: `{ model: <från konfiguration>, prompt: "...", system: "...", stream: false }`
- Error handling: catch fetch errors och returnera "❌ Could not connect to local AI. Is Ollama running?"
- Parse response (Ollama returnerar `{ response: "..." }`)

### 3. src/prompts/diplomat.ts
- Exportera konstant `DIPLOMAT_SYSTEM_PROMPT`
- Innehåll: "Du är en expert på kommunikation för utvecklare. Skriv om användarens text så den blir vänlig, professionell och tydlig, men behåll den tekniska betydelsen. Var kortfattad."

### 4. src/extension.ts
- `activate()` funktion som registrerar `bridge.diplomat` command
- Command handler:
  1. Hämta active editor och selected text
  2. Visa fel om ingen text är vald via `vscode.window.showErrorMessage()`
  3. Använd `vscode.window.withProgress()` med:
     - `location: vscode.ProgressLocation.Notification`
     - `title: "Bridging thoughts... 🧠"`
     - `cancellable: false`
  4. I progress callback: Anropa `bridgeText()` med text och `DIPLOMAT_SYSTEM_PROMPT`
  5. Ersätt markerad text med AI-svar via `editor.edit()`
  6. Visa felmeddelande via `vscode.window.showErrorMessage()` om bridgeText() kastar error

### 5. Konfigurationsfiler
- `tsconfig.json`: VS Code extension TypeScript config
- `.gitignore`: node_modules, out/, *.vsix, .vscode-test/
- `.vscodeignore`: exclude files från package
- `.vscode/launch.json`: debug configuration för extension

### 6. Dokumentation
- `README.md`: Installation, usage, requirements (Ollama måste köra), konfiguration av modell
- Uppdatera `agent.md` med projektinfo enligt mall

## Tekniska Detaljer

- Ollama API: POST till `/api/generate` med `model`, `prompt`, `system`, `stream: false`
- Model selection: Läses från VS Code configuration `bridge.model` (default: "llama3.2") - användare kan ändra i Settings
- Response parsing: Ollama returnerar `{ response: string }` när `stream: false`
- Error handling: Nätverksfel → tydligt felmeddelande till användaren via `vscode.window.showErrorMessage()`
- Progress indication: Använd `vscode.window.withProgress()` för professionell laddningsindikator med snurrande ikon

## Testning

- Manuell testning: Starta extension, markera text, kör command
- Verifiera: Text ersätts korrekt, felmeddelanden visas när Ollama inte körs
- Verifiera: Modell kan ändras i Settings och används korrekt

## Todos

1. Skapa projektstruktur med mappar (src/services, src/prompts) och konfigurationsfiler (package.json, tsconfig.json, .gitignore, .vscodeignore)
2. Implementera ollamaService.ts med bridgeText-funktion som läser modell från konfiguration och anropar Ollama API med error handling
3. Skapa diplomat.ts med DIPLOMAT_SYSTEM_PROMPT konstant
4. Implementera extension.ts med command registration, vscode.window.withProgress för progress indication, och text replacement logik
5. Skapa .vscode/launch.json för debugging extension
6. Skapa README.md med konfigurationsinstruktioner och uppdatera agent.md med projektinformation

