# .bridge - Developer Tone Translator

VS Code Extension som hjälper utvecklare att omformulera teknisk/kort text till professionell text direkt i editorn. Använder en lokal AI-modell som körs på din maskin (default: `mistral`).

## Krav

- VS Code 1.74.0 eller senare
- En lokal AI-server som lyssnar på `http://localhost:11434` (t.ex. `mistral`, `llama3.2`, `qwen2.5-coder`)

## Installation

1. Klona eller kopiera detta repository
2. Öppna projektet i VS Code
3. Kör `npm install` för att installera dependencies
4. Tryck `F5` för att öppna ett nytt VS Code-fönster med extensionen aktiverad

## Användning

1. Markera texten du vill omformulera i editorn
2. Använd kortkommandot `Cmd+Shift+B` (Mac) eller `Ctrl+Shift+B` (Windows/Linux)
3. Eller använd Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) och sök efter "Bridge: Socialize Text"
4. Vänta medan AI:n bearbetar texten (du ser en progress-indikator)
5. Den markerade texten ersätts automatiskt med den omformulerade versionen

## Konfiguration

Du kan ändra vilken lokal modell som används i VS Code Settings:

1. Öppna Settings (`Cmd+,` / `Ctrl+,`)
2. Sök efter "bridge.model"
3. Ändra värdet till din önskade modell (t.ex. `mistral`, `qwen2.5-coder`)

Standardmodellen är `mistral`.

## Felsökning

### "Could not connect to local AI. Is the local model running?"

- Kontrollera att din lokala AI-server körs.
- Verifiera att modellen finns installerad i din lokala miljö.
- Om modellen saknas, installera den med respektive verktyg.

### Extension svarar inte

- Kontrollera att du har markerat text innan du kör kommandot
- Kontrollera att modellen är korrekt konfigurerad i Settings

## Utveckling

### Bygga extensionen

```bash
npm run compile
```

### Watch mode (för utveckling)

```bash
npm run watch
```

### Package extension

```bash
npm run package
```

Detta skapar en `.vsix`-fil som kan installeras i VS Code.

## License

MIT

