# QA Suite - Automated Testing

Detta är en automatiserad kvalitetskontroll (QA) för .bridge extensionen.

## Setup

1. Se till att Ollama körs lokalt:
   ```bash
   ollama serve
   ```

2. Se till att Mistral-modellen är installerad:
   ```bash
   ollama pull mistral
   ```

## Kör QA-sviten

### Metod 1: Med ts-node (Rekommenderat)

```bash
npx ts-node --project qa/tsconfig.json qa/runner.ts
```

Eller om du har ts-node installerat globalt:

```bash
ts-node --project qa/tsconfig.json qa/runner.ts
```

### Metod 2: Kompilera först

```bash
# Kompilera
npx tsc --project qa/tsconfig.json

# Kör
node out/qa/runner.js
```

## Vad gör scriptet?

1. Läser in 50 test cases från `qa/dataset.ts`
2. För varje test case:
   - Anropar Ollama (Mistral) med Translator-prompten
   - Mäter latens (response time)
   - Sparar resultatet
   - Väntar 2 sekunder (cool-down)
3. Sparar alla resultat i `qa/qa_results.json`

## Resultat

Resultaten sparas i `qa/qa_results.json` med följande struktur:

```json
[
  {
    "id": 1,
    "input": "...",
    "output": "...",
    "latency_ms": 1234,
    "timestamp": "2025-01-28T..."
  },
  ...
]
```

## Analysera resultat

Du kan sedan mata in `qa_results.json` i Claude/ChatGPT för automatisk betygsättning av kvaliteten på översättningarna.

