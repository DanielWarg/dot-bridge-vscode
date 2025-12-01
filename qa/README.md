# QA Suite - Automated Testing

This is an automated quality assurance (QA) suite for the .bridge extension.

## Setup

1. Make sure Ollama is running locally:
   ```bash
   ollama serve
   ```

2. Make sure the Mistral model is installed:
   ```bash
   ollama pull mistral
   ```

## Running the QA Suite

### With ts-node (Recommended)

```bash
cd qa
npx ts-node runner.ts
```

### Compile First

```bash
# Compile
npx tsc --project qa/tsconfig.json

# Run
node out/qa/runner.js
```

## What does the script do?

1. Loads 50 test cases from `qa/dataset.ts`
2. For each test case:
   - Calls Ollama (Mistral) with Universal Prompt
   - Measures latency (response time)
   - Saves the result
   - Waits 3 seconds (cool-down)
3. Saves all results to `qa/qa_results.json`

## Results

Results are saved in `qa/qa_results.json` with the following structure:

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

## Analyze Results

Run the analysis script:

```bash
python3 analyze_results.py
```

This gives you an overview of the quality of the translations.
