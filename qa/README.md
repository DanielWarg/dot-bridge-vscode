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

### Med ts-node (Rekommenderat)

```bash
cd qa
npx ts-node runner.ts
```

### Kompilera först

```bash
# Kompilera
npx tsc --project qa/tsconfig.json

# Kör
node out/qa/runner.js
```

## Vad gör scriptet?

1. Läser in 50 test cases från `qa/dataset.ts`
2. För varje test case:
   - Anropar Ollama (Mistral) med Universal Prompt
   - Mäter latens (response time)
   - Sparar resultatet
   - Väntar 3 sekunder (cool-down)
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

Kör analys-scriptet:

```bash
python3 analyze_results.py
```

Detta ger dig en översikt över kvaliteten på översättningarna.
