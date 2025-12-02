#!/usr/bin/env python3
import json
import re

try:
    with open('extended_universal_results.json', 'r') as f:
        data = json.load(f)
    
    print(f"📊 Progress: {len(data)}/30 tests")
    print()
    
    if len(data) > 0:
        # Check for chatty phrases
        chatty_patterns = [
            (r"Here'?s a (polished|suggested|revised) version", "Here's a version"),
            (r"Here is the (polished|translated) text", "Here is the text"),
            (r"Sure,? (here is|I can help)", "Sure, here is"),
            (r"I have (rewritten|corrected|polished)", "I have rewritten"),
            (r"^Output:", "Output:"),
            (r"^Translation:", "Translation:"),
            (r"Här är (ett förslag|den polerade versionen)", "Här är förslag"),
        ]
        
        chatty_tests = []
        for r in data:
            output = r['output']
            for pattern, name in chatty_patterns:
                if re.search(pattern, output, re.IGNORECASE):
                    chatty_tests.append((r['id'], name, output[:80]))
                    break
        
        print(f"⚠️  Chatty phrases found: {len(chatty_tests)}/{len(data)}")
        if chatty_tests:
            print("   Tests with chatty phrases:")
            for test_id, phrase, preview in chatty_tests:
                print(f"   - Test #{test_id}: '{phrase}' - {preview}...")
        else:
            print("   ✅ No chatty phrases detected!")
        print()
        
        # Check for quotes
        quoted = [r for r in data if r['output'].startswith('"') and r['output'].endswith('"')]
        print(f"📝 Quoted outputs: {len(quoted)}/{len(data)}")
        if quoted:
            print("   Tests with quotes:")
            for r in quoted[:3]:  # Show first 3
                print(f"   - Test #{r['id']}: {r['output'][:60]}...")
        print()
        
        # Show last test
        last = data[-1]
        print(f"⏱️  Last test (#{last['id']}):")
        print(f"   Category: {last['category']}")
        print(f"   Input: {last['input'][:60]}...")
        print(f"   Output: {last['output'][:100]}...")
        print(f"   Latency: {last['latency_ms']}ms")
        
except FileNotFoundError:
    print("⏳ Test file not created yet")
except Exception as e:
    print(f"Error: {e}")


