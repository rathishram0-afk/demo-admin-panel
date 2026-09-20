import re

with open(r'C:\Users\rathi\.gemini\antigravity\scratch\g-force-gaming-hub\src\services\sessionService.js', 'r', encoding='utf-8') as f:
    content = f.read()

for i, line in enumerate(content.split('\n'), 1):
    if 'rawTs' in line or 'time' in line.lower() and ('created_at' in line.lower() or 'getbusinessdate' in line.lower()):
        print(f"Line {i}: {line.strip()}")
