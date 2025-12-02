import json

with open('qa_results.json', 'r') as f:
    data = json.load(f)

print(f"📊 Regression Test Results Analysis\n")
print(f"Total tests: {len(data)}/50 ✅\n")

# Analysera format
both_formats = []
email_only = []
status_only = []
no_format = []

for test in data:
    output = test['output']
    has_email = 'Subject:' in output
    has_status = 'Status Update' in output or '### 💬' in output
    
    if has_email and has_status:
        both_formats.append(test['id'])
    elif has_email and not has_status:
        email_only.append(test['id'])
    elif has_status and not has_email:
        status_only.append(test['id'])
    else:
        no_format.append(test['id'])

print(f"✅ Status Update only: {len(status_only)} tests")
print(f"📧 Email only: {len(email_only)} tests")
print(f"⚠️  BOTH formats (PROBLEM): {len(both_formats)} tests")
if both_formats:
    print(f"   Test IDs with both formats: {both_formats}")
print(f"❌ No format detected: {len(no_format)} tests")
if no_format:
    print(f"   Test IDs with no format: {no_format}")

print(f"\n📈 Success rate: {len(status_only) + len(email_only)}/{len(data)} = {round((len(status_only) + len(email_only))/len(data)*100, 1)}%")


