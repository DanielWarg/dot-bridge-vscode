#!/usr/bin/env python3
import json
import os
from collections import Counter

try:
    with open('extended_universal_results.json', 'r') as f:
        data = json.load(f)
    
    print(f'✅ Test Status: {len(data)}/30 tests completed')
    print(f'📊 Progress: {round(len(data)/30*100, 1)}%')
    print()
    
    if len(data) > 0:
        # Last test info
        last = data[-1]
        print(f'⏱️  Last test (#{last["id"]}):')
        print(f'   Category: {last["category"]}')
        print(f'   Input words: {last["inputWordCount"]}')
        print(f'   Output words: {last["outputWordCount"]}')
        print(f'   Latency: {last["latency_ms"]}ms')
        print()
        
        # Errors
        errors = [r for r in data if r['output'].startswith('ERROR:')]
        if errors:
            print(f'❌ Errors: {len(errors)}')
            for e in errors:
                print(f'   Test #{e["id"]}: {e["output"][:60]}...')
        else:
            print(f'✅ No errors so far')
        print()
        
        # Category breakdown
        categories = Counter(r['category'] for r in data)
        print('📈 By Category:')
        for cat, count in sorted(categories.items()):
            print(f'   {cat}: {count}')
        print()
        
        # Average latency
        avg_latency = sum(r['latency_ms'] for r in data) / len(data)
        print(f'⏱️  Average latency: {round(avg_latency)}ms')
        
        # Estimate remaining time
        if len(data) < 30:
            remaining = 30 - len(data)
            estimated_minutes = (remaining * (avg_latency / 1000 + 3)) / 60
            print(f'⏳ Estimated time remaining: ~{round(estimated_minutes, 1)} minutes')
    
except FileNotFoundError:
    print('⏳ Test file not created yet')
except json.JSONDecodeError as e:
    print(f'⚠️  JSON decode error: {e}')
    print('   (Test may be writing to file...)')
except Exception as e:
    print(f'❌ Error: {e}')


