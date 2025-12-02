#!/usr/bin/env python3
import json

with open('extended_universal_results.json', 'r') as f:
    data = json.load(f)

print("=" * 60)
print("📊 Extended Universal Prompt Test Results")
print("=" * 60)
print()

if len(data) == 30:
    print("✅ TEST COMPLETE! All 30 tests finished!")
else:
    print(f"⏳ Progress: {len(data)}/30 tests completed")
print()

# Summary stats
errors = [r for r in data if r['output'].startswith('ERROR:')]
print(f"📊 Summary:")
print(f"   Total: {len(data)}")
print(f"   Errors: {len(errors)}")
if len(data) > 0:
    print(f"   Success rate: {round((len(data)-len(errors))/len(data)*100, 1)}%")
print()

# Latency stats
latencies = [r['latency_ms'] for r in data if not r['output'].startswith('ERROR:')]
if latencies:
    print(f"⏱️  Latency:")
    print(f"   Average: {round(sum(latencies)/len(latencies))}ms")
    print(f"   Min: {min(latencies)}ms")
    print(f"   Max: {max(latencies)}ms")
    print(f"   Total time: {round(sum(latencies)/1000/60, 1)} minutes")
print()

# Input/Output ratio
ratios = []
for r in data:
    if not r['output'].startswith('ERROR:') and r['inputWordCount'] > 0:
        ratio = r['outputWordCount'] / r['inputWordCount']
        ratios.append((r['id'], ratio, r['inputWordCount'], r['outputWordCount']))

if ratios:
    avg_ratio = sum(r[1] for r in ratios) / len(ratios)
    print(f"📝 Output/Input Ratio:")
    print(f"   Average: {round(avg_ratio, 2)}x")
    print(f"   Min: {round(min(r[1] for r in ratios), 2)}x (Test #{min(r[0] for r in ratios if r[1] == min(r[1] for r in ratios))})")
    print(f"   Max: {round(max(r[1] for r in ratios), 2)}x (Test #{max(r[0] for r in ratios if r[1] == max(r[1] for r in ratios))})")
    print()
    
    # Find extreme cases
    print("🔍 Extreme Cases:")
    max_ratio = max(ratios, key=lambda x: x[1])
    min_ratio = min(ratios, key=lambda x: x[1])
    print(f"   Highest expansion: Test #{max_ratio[0]} ({max_ratio[2]} → {max_ratio[3]} words, {round(max_ratio[1], 2)}x)")
    print(f"   Highest compression: Test #{min_ratio[0]} ({min_ratio[2]} → {min_ratio[3]} words, {round(min_ratio[1], 2)}x)")

# Category breakdown
from collections import Counter
categories = Counter(r['category'] for r in data)
print()
print("📈 By Category:")
for cat, count in sorted(categories.items()):
    cat_data = [r for r in data if r['category'] == cat]
    avg_lat = sum(r['latency_ms'] for r in cat_data) / len(cat_data)
    print(f"   {cat}: {count} tests, avg latency: {round(avg_lat)}ms")


