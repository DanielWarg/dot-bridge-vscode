#!/usr/bin/env python3
import json

with open('extended_universal_results.json', 'r') as f:
    data = json.load(f)

latencies = [r['latency_ms'] for r in data if not r['output'].startswith('ERROR:')]

if latencies:
    print("⏱️  RESPONSTID-STATISTIK:")
    print()
    avg = sum(latencies) / len(latencies)
    print(f"   Genomsnittlig latens: {round(avg)}ms ({round(avg/1000, 2)}s)")
    print(f"   Median: {sorted(latencies)[len(latencies)//2]}ms")
    print(f"   Min: {min(latencies)}ms")
    print(f"   Max: {max(latencies)}ms ({round(max(latencies)/1000, 2)}s)")
    print()
    
    # Per kategori
    from collections import defaultdict
    by_category = defaultdict(list)
    for r in data:
        if not r['output'].startswith('ERROR:'):
            by_category[r['category']].append(r['latency_ms'])
    
    print("📊 Per kategori:")
    for cat in sorted(by_category.keys()):
        avg = sum(by_category[cat]) / len(by_category[cat])
        print(f"   {cat}: {round(avg)}ms ({len(by_category[cat])} tester)")
    
    # Percentiler
    sorted_lat = sorted(latencies)
    p50 = sorted_lat[len(sorted_lat)//2]
    p90 = sorted_lat[int(len(sorted_lat)*0.9)]
    p95 = sorted_lat[int(len(sorted_lat)*0.95)]
    
    print()
    print("📈 Percentiler:")
    print(f"   P50 (median): {p50}ms")
    print(f"   P90: {p90}ms ({round(p90/1000, 2)}s)")
    print(f"   P95: {p95}ms ({round(p95/1000, 2)}s)")

