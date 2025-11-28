# .bridge - Developer Tone Translator

VS Code Extension som hjälper utvecklare att omformulera teknisk/kort text till professionell text direkt i editorn. Använder lokal AI via Ollama.

## Krav

- VS Code 1.74.0 eller senare
- [Ollama](https://ollama.ai/) installerat och körande lokalt
- En Ollama-modell installerad (t.ex. `llama3.2`, `mistral`, `qwen2.5-coder`)

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

Du kan ändra vilken Ollama-modell som används i VS Code Settings:

1. Öppna Settings (`Cmd+,` / `Ctrl+,`)
2. Sök efter "bridge.model"
3. Ändra värdet till din önskade modell (t.ex. `mistral`, `qwen2.5-coder`)

Standardmodellen är `llama3.2`.

## Felsökning

### "Could not connect to local AI. Is Ollama running?"

- Kontrollera att Ollama körs: `ollama serve` i terminalen
- Verifiera att modellen finns installerad: `ollama list`
- Om modellen saknas, installera den: `ollama pull llama3.2` (eller din valda modell)

### Extension svarar inte

- Kontrollera att du har markerat text innan du kör kommandot
- Kontrollera att Ollama-modellen är korrekt konfigurerad i Settings

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

